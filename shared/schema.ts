import { z } from "zod";

export const awsCredentialsSchema = z.object({
  accessKeyId: z.string().min(1, "Access Key ID is required"),
  secretAccessKey: z.string().min(1, "Secret Access Key is required"),
  region: z.string().min(1, "Region is required"),
  sessionToken: z.string().optional(),
});

export const roleAssumptionSchema = z.object({
  roleArn: z.string().min(1, "Role ARN is required"),
  region: z.string().min(1, "Region is required"),
  sessionName: z.string().optional(),
});

export const s3ObjectSchema = z.object({
  key: z.string(),
  size: z.number().optional(),
  lastModified: z.date().optional(),
  etag: z.string().optional(),
  storageClass: z.string().optional(),
  isFolder: z.boolean(),
});

export const s3BucketSchema = z.object({
  name: z.string(),
  region: z.string(),
  creationDate: z.date().optional(),
});

export type AwsCredentials = z.infer<typeof awsCredentialsSchema>;
export type RoleAssumption = z.infer<typeof roleAssumptionSchema>;
export type S3Object = z.infer<typeof s3ObjectSchema>;
export type S3Bucket = z.infer<typeof s3BucketSchema>;

export interface S3Session {
  id: string;
  credentials: AwsCredentials;
  createdAt: Date;
}
