"use strict";

const AWS = require("aws-sdk");
const S3 = new AWS.S3();
const sharp = require("sharp");
const { basename, extname } = require("path");

module.exports.handle = async ({ Records: records }) => {
  try {
    await Promise.all(
      records.map(async (record) => {
        const { key } = record.s3.object; // referência da imagem

        const image = await S3.getObject({
          Bucket: process.env.uploaded,
          Key: key,
        }).promise();

        const shrinked = await sharp(image.Body)
          .resize(640, 480, {
            fit: "inside",
            withoutEnlargement: true,
          })
          .toFormat("jpeg", { progressive: true, quality: 50 })
          .toBuffer();

        await S3.putObject({
          Body: shrinked,
          Bucket: process.env.shrinked,
          ContentType: "image/jpeg",
          Key: `shrinked/${basename(key, extname(key))}.jpg`,
        }).promise();
      })
    );

    return {
      statusCode: 301,
      body: {},
    };
  } catch (err) {
    return err;
  }
};
