import fs from 'fs'
import async from 'async'
import https from 'https'

export default class BackupStorage {
  constructor(options) {
    this.simultaneousBackups = 10
    // The base path  is the root of your local 
    this.basePath = options?.basePath?.replace(/^\/+|\/+$/g, '') || './backups'
  }

  /**
   * Set the id of the current space
   * @param {int} spaceId The id of the space
   */
  setSpace(spaceId) {
    this.spaceId = spaceId
    if (!fs.existsSync(this.spaceDirectory)) {
      fs.mkdirSync(this.spaceDirectory, { recursive: true })
    }
  }

  /**
   * Backup all the assets from an array
   * @param {Array} assets The array of the assets' objects from Storyblok
   * @return {Promise} The Promise will return a true or false 
   */
  async backupAssets(assets) {
    return new Promise((resolve, reject) => {
      async.eachLimit(assets, this.simultaneousBackups, async (asset) => {
        const backupAssetRes = await this.backupAsset(asset)
        if (!backupAssetRes) {
          console.log(`Error backing up ${asset.filename}`)
        }
      }, (err) => {
        if (err) {
          return reject(false)
        }
        if (typeof this.afterBackupCallback === 'function') {
          this.afterBackupCallback()
        }
        return resolve(true)
      })
    })
  }

  /**
   * Return the list of the ids in the backup. It must
   * return an array of integers
   * @returns {Array} An array of integers with all the ids
   */
  async backedupAssetsIds() {
    console.log('You forgot to override the "backedupAssetsIds" method')
  }

  /**
   * Return the list of the assets already backed up.
   * @returns {Array} An array of asset objects
   */
  async backedupAssets() {
    console.log('You forgot to override the "backedupAssets" method')
  }

  /**
   * Backs up an asset. It must return true or false depending on the success
   * of the action
   * @param {Object} asset The asset object from Storyblok
   * @returns {Bool} Success of the action
   */
  async backupAsset(asset) {
    console.log('You forgot to override the "backupAsset" method')
  }

  /**
   * The space directory
   */
  get spaceDirectory() {
    return `${this.basePath}/${this.spaceId}`
  }

  /**
   * The asset directory
   * @param {Object} asset The asset object from Storyblok
   * @returns {String} The path of the directory
   */
  getAssetDirectory(asset) {
    return `${this.spaceDirectory}/${asset.id}`
  }

  /**
   * Download an asset locally
   * @param {Object} asset The asset object from Storyblok
   * @returns 
   */
  async downloadAsset(asset) {
    const filename = asset.filename.split('/').pop()
    const file = fs.createWriteStream(`${this.getAssetDirectory(asset)}/${filename}`)

    return new Promise((resolve, reject) => {
      https.get(asset.filename, (res) => {
        if (res.statusCode === 200) {
          res.pipe(file)
          file.on('finish', function () {
            file.close(resolve(true))
          })
        } else {
          return reject(false)
        }
      }).on('error', (err) => {
        return reject(false)
      })
    })
  }
}
