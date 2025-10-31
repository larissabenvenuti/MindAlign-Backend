import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

router.get(
  "/api/activity",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId;
      if (!userId) return res.status(401).json({ error: "Usuário não autenticado." });

      const events = await prisma.event.findMany({
        where: { userId },
        take: 5,
        orderBy: { start: "desc" },
      });
      const notes = await prisma.note.findMany({
        where: { userId },
        take: 5,
        orderBy: { date: "desc" },
      });
      const habits = await prisma.habit.findMany({
        where: { userId },
        take: 5,
        orderBy: { createdAt: "desc" },
      });
      const tasks = await prisma.task.findMany({
        where: { userId },
        take: 5,
        orderBy: { createdAt: "desc" },
      });

      const activities = [
        ...events.map((e) => ({
          id: e.id,
          type: "event",
          content: e.title,
          date: e.start,
        })),
        ...notes.map((n) => ({
          id: n.id,
          type: "note",
          content: n.content,
          date: n.date,
        })),
        ...habits.map((h) => ({
          id: h.id,
          type: "habit",
          content: h.name,
          date: h.createdAt,
        })),
        ...tasks.map((t) => ({
          id: t.id,
          type: "task",
          content: t.text,
          date: t.createdAt,
        })),
      ];

      activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      res.json(activities.slice(0, 8));
    } catch (err) {
      res.status(500).json({ error: "Erro ao buscar atividades." });
    }
  }
);

export default router;
