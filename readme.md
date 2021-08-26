# Storyblok Assets Backup
Backup all the assets of your spaces. You can perform the backup for specific spaces or for all of them. The backup is incremental, so it will save just what is missing from your current backup. Backups can be performed locally or on an S3 bucket.

## Getting Started
This is an example of how you can use this package

```js
import SbBackup from 'storyblok-assets-backup'

const sbBackup = new SbBackup({
    token: '', 
    storage: 's3',
    s3Settings: {
      accessKeyId: '',
      secretAccessKey: ''
    }
})

sbBackup.backupSpace(123456)
sbBackup.backupAllSpaces()
```

## Settings
The settings of the constructor of the class `SbBackup` are:
- **token**: the oauth token of your Storyblok account. You can retrieve it [here](https://app.storyblok.com/#!/me/account);  
- **storage**: the value can be `local` or `s3`. `local` will make the script store files on a local folder. You can [read more here](#data-structure) about the folders and the data structure;
- **basePath**: optional, defaults to `./backups` - this is the path of the backup folder in case you are performing a local backup;
- **s3Settings.accessKeyId**: optional - this is the IAM access key id for authentication on your S3 bucket;  
- **s3Settings.secretAccessKey**: optional - this is the IAM secret access key for authentication on your S3 bucket.

## Methods
All instances of the `SbBackup` class can perform 2 actions: backup a space or backup all the spaces.

### SbBackup.backupSpace(spaceId)
This method can backup a single space. You have to provide the space id as an argument.

**Example**:
```
sbBackup.backupSpace(123456)
```

### SbBackup.backupAllSpaces()
This method can backup all the spaces in your account.

**Example**:
```
sbBackup.backupAllSpaces()
```

## Data structure
The script will store and organise the content by creating a folder for each space, the folder will have the id of the space. Inside the folder of the space there will be a folder with the id of each asset. Inside the folder of each asset there will be the asset itself and a file called `sb_asset_data.json` with the [Asset Object](https://www.storyblok.com/docs/api/management#core-resources/assets/the-asset-object) from the Storyblok MAPI. The structure will be the same for both the `local` and the `s3` backups.

When performing the S3 backup the script will create a `./temp` folder to store the files temporarily before sending them to the bucket.
