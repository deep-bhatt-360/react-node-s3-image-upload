import {
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client(
  {
    credentials: {
      accessKeyId: process.env.ACCESS_KEY_ID,
      secretAccessKey: process.env.ACCESS_SECRET,
    }
  }
);
const BUCKET = process.env.BUCKET;

export const uploadToS3 = async ({ file, fileName }) => {
  const key = `${fileName}`;
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  try {
    await s3.send(command);
    return { key };
  } catch (error) {
    console.log(error);
    return { error };
  }
};

const getImageKeysByUser = async () => {
  const command = new ListObjectsV2Command({
    Bucket: BUCKET
  });

  const { Contents = [] } = await s3.send(command);

  return Contents.sort(
    (a, b) => new Date(b.LastModified) - new Date(a.LastModified)
  ).map((image) => image.Key);
};

export const getUserPresignedUrls = async () => {
  try {
    const imageKeys = await getImageKeysByUser();

    const presignedUrls = await Promise.all(
      imageKeys.map(async (key) => {
        const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
        const url = await getSignedUrl(s3, command, { expiresIn: 900 }); // default
        return { fileName: key, presignedUrl: url };
      })
    );
    return { presignedUrls };
  } catch (error) {
    console.log(error);
    return { error };
  }
};
