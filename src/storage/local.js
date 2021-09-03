import BackupStorage from './backup-storage.js'
import glob from 'glob'
import fs from 'fs'

export default class LocalStorage extends BackupStorage {
  constructor(options) {
    super(options)
  }

  /**
   * Override of the default method
   */
  async backedUpAssets() {
    const assets = glob.sync(`${this.spaceDirectory}/**/sb_asset_data_*.json`)

    return assets.map(file => {
      const path_parts = file.split('/')
      const timestamp = file.match(/sb_asset_data_(.*).json/)[1]

      return {
        id: parseInt(path_parts[path_parts.length - 2]),
        updated_at: parseInt(timestamp)
      }
    })
  }

  /**
   * Override of the default method
   */
  async backupAsset(asset) {
    if (!fs.existsSync(this.getAssetDirectory(asset))) {
      fs.mkdirSync(this.getAssetDirectory(asset), { recursive: true })
    }
    try {
      fs.writeFileSync(`${this.getAssetDirectory(asset)}/${this.getAssetDataFilename(asset)}`, JSON.stringify(asset, null, 4))
      await this.downloadAsset(asset)
      return true
    } catch (err) {
      fs.rmdirSync(this.getAssetDirectory(asset), { recursive: true })
      return false
    }
  }
}
