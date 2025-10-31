import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

const router = Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post("/api/auth/register", async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) return res.status(400).send("Faltando dados");
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(400).send("Usuário já existe");
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashed, name },
    });
    res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
    });
  } catch (err: any) {
    console.error("Erro no cadastro:", err.message);
    res.status(500).send("Erro interno no cadastro");
  }
});

router.post("/api/auth/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.password) return res.status(401).send("Dados inválidos");
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return res.status(401).send("Dados inválidos");
  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" }
  );
  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
    },
    token,
  });
});

router.post("/api/auth/google", async (req: Request, res: Response) => {
  const { token } = req.body as { token?: string };
  if (!token) return res.status(400).send("Token ausente.");
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email)
      return res.status(401).send("Token inválido.");
    const { email, name, picture } = payload;
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: { email, name: name ?? undefined, image: picture ?? undefined },
      });
    }
    const appToken = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );
    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
      token: appToken,
    });
  } catch (error: any) {
    console.error("Erro login Google:", error.message);
    return res.status(401).send("Falha ao autenticar Google.");
  }
});

export default router;