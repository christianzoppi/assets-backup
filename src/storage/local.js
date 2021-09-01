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
    return assetIds.map((assetId) => {
      const metaDataFile = fs.readdirSync(`${this.spaceDirectory}/${assetId}`, { withFileTypes: true })
        .find(dirEntry => dirEntry.name.startsWith('sb_asset_data_'))
      return {
        id: assetId,
        updated_at: metaDataFile.name.match(/sb_asset_data_(.*).json/)[1]
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
      fs.writeFileSync(`${this.getAssetDirectory(asset)}/sb_asset_data_${asset.updated_at}.json`, JSON.stringify(asset, null, 4))
      await this.downloadAsset(asset)
      return true
    } catch (err) {
      fs.rmdirSync(this.getAssetDirectory(asset), { recursive: true })
      return false
    }
  }
}
