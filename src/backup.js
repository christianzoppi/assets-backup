import LocalStorage from './storage/local.js'
import S3Storage from './storage/s3.js'
import StoryblokClient from 'storyblok-js-client'

export default class SbBackup {
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