import { S3Client, ListBucketsCommand, ListObjectsV2Command, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { AwsCredentials, RoleAssumption, S3Bucket, S3Object } from "@shared/schema";

export class AwsService {
  private s3Client: S3Client | null = null;

  async initializeWithCredentials(credentials: AwsCredentials): Promise<void> {
    this.s3Client = new S3Client({
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        sessionToken: credentials.sessionToken,
      },
      region: credentials.region,
    });
  }

  async initializeWithRole(roleConfig: RoleAssumption): Promise<AwsCredentials> {
    // For role assumption, we need initial credentials from environment or instance profile
    const stsClient = new STSClient({ 
      region: roleConfig.region,
      // This will use default credential provider chain (env vars, instance profile, etc.)
    });
    
    const command = new AssumeRoleCommand({
      RoleArn: roleConfig.roleArn,
      RoleSessionName: roleConfig.sessionName || 'S3ClientSession',
    });

    const response = await stsClient.send(command);
    
    if (!response.Credentials) {
      throw new Error('Failed to assume role');
    }

    const credentials: AwsCredentials = {
      accessKeyId: response.Credentials.AccessKeyId!,
      secretAccessKey: response.Credentials.SecretAccessKey!,
      sessionToken: response.Credentials.SessionToken,
      region: roleConfig.region,
    };

    await this.initializeWithCredentials(credentials);
    return credentials;
  }

  async listBuckets(): Promise<S3Bucket[]> {
    if (!this.s3Client) {
      throw new Error('AWS client not initialized');
    }

    const command = new ListBucketsCommand({});
    const response = await this.s3Client.send(command);

    return (response.Buckets || []).map(bucket => ({
      name: bucket.Name!,
      region: 'us-east-1', // Default, would need GetBucketLocation for actual region
      creationDate: bucket.CreationDate,
    }));
  }

  async listObjects(bucketName: string, prefix: string = '', delimiter: string = '/'): Promise<S3Object[]> {
    if (!this.s3Client) {
      throw new Error('AWS client not initialized');
    }

    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
      Delimiter: delimiter,
    });

    const response = await this.s3Client.send(command);
    const objects: S3Object[] = [];

    // Add folders (common prefixes)
    if (response.CommonPrefixes) {
      for (const prefix of response.CommonPrefixes) {
        objects.push({
          key: prefix.Prefix!,
          isFolder: true,
        });
      }
    }

    // Add files
    if (response.Contents) {
      for (const object of response.Contents) {
        if (object.Key !== prefix) { // Exclude the prefix itself
          objects.push({
            key: object.Key!,
            size: object.Size,
            lastModified: object.LastModified,
            etag: object.ETag,
            storageClass: object.StorageClass,
            isFolder: false,
          });
        }
      }
    }

    return objects;
  }

  async getDownloadUrl(bucketName: string, key: string): Promise<string> {
    if (!this.s3Client) {
      throw new Error('AWS client not initialized');
    }

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
  }

  async deleteObject(bucketName: string, key: string): Promise<void> {
    if (!this.s3Client) {
      throw new Error('AWS client not initialized');
    }

    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  async uploadObject(bucketName: string, key: string, body: Buffer | Uint8Array | string): Promise<void> {
    if (!this.s3Client) {
      throw new Error('AWS client not initialized');
    }

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: body,
    });

    await this.s3Client.send(command);
  }
}

export const awsService = new AwsService();
