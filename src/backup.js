import LocalStorage from './storage/local.js'
import S3Storage from './storage/s3.js'
import StoryblokClient from 'storyblok-js-client'

export default class SbBackup {
  /**
   * Create a new instance of the SbBackup tool
   * @param {int} param0.token The oauth token of the user
   * @param {string} param0.storage local or s3, it's the type of storage
   * @param {string} param0.basePath The local path of the backups
   * @param {string} param0.s3Settings The settings for the s3 authentication
   */
  constructor({ token, storage, basePath, s3Settings }) {
    this.sbClient = new StoryblokClient({
      oauthToken: token
    }, 'https://mapi.storyblok.com/v1/')

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
      console.error(`An error occurred while fetching the spaces: ${err.message}`)
    }
  }

  /**
   * Backup a single space
   * @param {int} spaceId The id of the space
   */
  async backupSpace(spaceId) {
    try {
      this.storage.setSpace(spaceId)
      const backedUpAssetsIds = await this.storage.backedupAssetsIds()
      const assets = (await this.getAssets(spaceId)).filter(asset => !backedUpAssetsIds.includes(asset.id))
      if (assets.length) {
        await this.storage.backupAssets(assets)
        console.log(`✓ Assets of space ${spaceId} backed up correctly`)
      } else {
        console.log(`✓ No new assets to backup in space ${spaceId}`)
      }
    } catch (err) {
      console.log(err)
      console.log(`✖ Backup task interrupted because of an error`)
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
      console.log('Error fetching the assets. Please double check the source space id.')
    }
  }
}