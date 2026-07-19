import { Router } from "express";
import { logger } from "../config/logger.js";
import multer from "multer";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuid } from "uuid";
import { config } from "../config/index.js";
import { verifyJWT, requireOwner } from "../middleware/auth.js";
import { prisma } from "../config/database.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Invalid file type"));
  },
});

const s3 = new S3Client({
  endpoint: config.s3.endpoint,
  region: "auto",
  credentials: {
    accessKeyId: config.s3.access_key,
    secretAccessKey: config.s3.secret_key,
  },
  forcePathStyle: true,
});

const router = Router();

router.use(verifyJWT, requireOwner);

router.post("/property/:propertyId", upload.single("file"), async (req, res) => {
  try {
    const property = await prisma.properties.findFirst({
      where: { id: req.params.propertyId, owner_id: req.user!.id, deleted_at: null },
    });
    if (!property) { res.status(404).json({ error: "Property not found" }); return; }

    const ext = req.file!.originalname.split(".").pop();
    const key = `properties/${req.params.propertyId}/${uuid()}.${ext}`;

    await s3.send(new PutObjectCommand({
      Bucket: config.s3.bucket,
      Key: key,
      Body: req.file!.buffer,
      ContentType: req.file!.mimetype,
      ACL: "public-read",
    }));

    const url = `${config.s3.public_url}/${key}`;

    await prisma.properties.update({
      where: { id: req.params.propertyId },
      data: { photo_url: url },
    });

    res.json({ url });
  } catch (error) {
    logger.error(error, "Upload error:");
    res.status(500).json({ error: "Upload failed" });
  }
});

router.post("/tenant/ktp/:tenantId", upload.single("file"), async (req, res) => {
  try {
    const tenant = await prisma.tenants.findFirst({
      where: { id: req.params.tenantId, property: { owner_id: req.user!.id } },
    });
    if (!tenant) { res.status(404).json({ error: "Tenant not found" }); return; }

    const ext = req.file!.originalname.split(".").pop();
    const key = `ktp/${req.params.tenantId}/${uuid()}.${ext}`;

    await s3.send(new PutObjectCommand({
      Bucket: config.s3.bucket,
      Key: key,
      Body: req.file!.buffer,
      ContentType: req.file!.mimetype,
    }));

    const signedUrl = await getSignedUrl(s3, new GetObjectCommand({
      Bucket: config.s3.bucket,
      Key: key,
    }), { expiresIn: 3600 });

    await prisma.tenants.update({
      where: { id: req.params.tenantId },
      data: { ktp_url: signedUrl },
    });

    res.json({ url: signedUrl });
  } catch (error) {
    logger.error(error, "Upload KTP error:");
    res.status(500).json({ error: "Upload failed" });
  }
});

export default router;
