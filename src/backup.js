import LocalStorage from './storage/local.js'
import S3Storage from './storage/s3.js'
import StoryblokClient from 'storyblok-js-client'

export default class SbBackup {
  /**
   * Create a new instance of the SbBackup tool
   * @param {string} param0.token The oauth token of the user
   * @param {string} param0.storage local or s3, it's the type of storage
   * @param {string} param0.basePath The local path of the backups
   * @param {string} param0.s3Settings The settings for the s3 authentication
   * @param {boolean} param0.metadata Check for updated metadata
   */
  constructor({ token, storage, basePath, s3Settings, metadata = true }) {
    this.sbClient = new StoryblokClient({
      oauthToken: token
    }, 'https://mapi.storyblok.com/v1/')

    this.metadata = metadata
    storage = storage || 'local'
    switch (storage) {
      case 'local':
        this.storage = new LocalStorage({ basePath })
        break
      case 's3':
        this.storage = new S3Storage({ basePath, s3Settings })
        break
    }
  }

  /**
   * Backup all the spaces in an account
   */
  async backupAllSpaces() {
    try {
      const spaces = await this.sbClient.get(`spaces`)
      if (spaces.data?.spaces.length) {
        for (let index = 0; index < spaces.data.spaces.length; index++) {
          await this.backupSpace(spaces.data.spaces[index].id)
        }
      } else {
        console.log('No spaces to backup.')
      }
    } catch (err) {
      console.error(`✖ An error occurred while fetching the spaces: ${err.message}`)
    }
  }

  /**
   * Backup a single space
   * @param {int} spaceId The id of the space
   */
  async backupSpace(spaceId) {
    try {
      this.storage.setSpace(spaceId)
      let assets
      if (this.metadata) {
        const backedUpAssets = await this.storage.backedupAssets()
        assets = (await this.getAssets(spaceId)).filter(asset => {
          const match = backedUpAssets.find(bAsset => bAsset.id === asset.id)
          if (match) {
            return new Date(asset.updated_at) > new Date(match.updated_at) 
          } else {
            return true
          }
        })
      } else {
        const backedUpAssetsIds = await this.storage.backedupAssetsIds()
        assets = (await this.getAssets(spaceId)).filter(asset => !backedUpAssetsIds.includes(asset.id))
      }
      if (assets.length) {
        await this.storage.backupAssets(assets)
        console.log(`✓ Assets of space ${spaceId} backed up correctly`)
      } else {
        console.log(`✓ No new assets to backup in space ${spaceId}`)
      }
    } catch (err) {
      console.error(err)
      console.error(`✖ Backup task interrupted because of an error`)
    }
  }

  /**
   * Get all the assets objects from a space
   * @param {int} spaceId The space id
   * @returns 
   */
  async getAssets(spaceId) {
    try {
      const assetsPageRequest = await this.sbClient.get(`spaces/${spaceId}/assets`, {
        per_page: 100,
        page: 1
      })
      const pagesTotal = Math.ceil(assetsPageRequest.headers.total / 100)
      const assetsRequests = []
      for (let i = 1; i <= pagesTotal; i++) {
        assetsRequests.push(
          this.sbClient.get(`spaces/${spaceId}/assets`, {
            per_page: 100,
            page: i
          })
        )
      }
      const assetsResponses = await Promise.all(assetsRequests)
      return assetsResponses.map(r => r.data.assets).flat()
    } catch (err) {
      console.error('✖ Error fetching the assets. Please double check the source space id.')
    }
  }
}
