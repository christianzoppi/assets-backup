import BackupStorage from './backup-storage.js'
import fs from 'fs'

export default class LocalStorage extends BackupStorage {
  constructor(options) {
    super(options)
  }

  /**
   * Override of the default method
   */
  async backedupAssetsIds() {
    return fs.readdirSync(this.spaceDirectory, { withFileTypes: true })
      .filter(file => file.isDirectory())
      .map(file => parseInt(file.name))
  }

  /**
   * Override of the default method
   */
  async backedupAssets() {
    const assetIds = await this.backedupAssetsIds()
    const assets = []
    for (const assetId of assetIds) {
      const metaDataFile = fs.readdirSync(`${this.spaceDirectory}/${assetId}`, { withFileTypes: true })
        .find(dirEntry => dirEntry.name.startsWith('sb_asset_data_'))
      const timestamp = metaDataFile?.name?.match(/sb_asset_data_(.*).json/)[1]
      if (timestamp) {
        assets.push({
          id: assetId,
          updated_at: timestamp
        })
      }
    }
    return assets
  }

  /**
   * Override of the default method
   */
  async backupAsset(asset) {
    if (!fs.existsSync(this.getAssetDirectory(asset))) {
      fs.mkdirSync(this.getAssetDirectory(asset), { recursive: true })
    }
    try {
      fs.writeFileSync(`${this.getAssetDirectory(asset)}/sb_asset_data_${asset.updated_at}.json`, JSON.stringify(asset, null, 4))
      await this.downloadAsset(asset)
      return true
    } catch (err) {
      fs.rmdirSync(this.getAssetDirectory(asset), { recursive: true })
      return false
    }
  }
}
