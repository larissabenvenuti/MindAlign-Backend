import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

router.get(
  "/api/habits",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const habits = await prisma.habit.findMany({
        where: { userId },
        select: { id: true, name: true, weekData: true },
      });
      res.json(
        habits.map((h) => ({
          ...h,
          weekData: JSON.parse(h.weekData),
        }))
      );
    } catch (error) {
      console.error("Error fetching habits:", error);
      res.status(500).json({ error: "Erro ao buscar hábitos" });
    }
  }
);

router.post(
  "/api/habits",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const { name } = req.body;
      if (!name || typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ error: "Nome do hábito obrigatório" });
      }
      const habit = await prisma.habit.create({
        data: {
          name: name.trim(),
          userId,
          weekData: JSON.stringify([
            false,
            false,
            false,
            false,
            false,
            false,
            false,
          ]),
        },
      });
      res.status(201).json({
        id: habit.id,
        name: habit.name,
        weekData: JSON.parse(habit.weekData),
      });
    } catch (error) {
      console.error("Error creating habit:", error);
      res.status(500).json({ error: "Erro ao criar hábito" });
    }
  }
);

router.patch(
  "/api/habits/:id/toggle",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const { id } = req.params;
      const { day } = req.body;
      const habit = await prisma.habit.findFirst({ where: { id, userId } });
      if (!habit) {
        return res.status(404).json({ error: "Hábito não encontrado" });
      }
      const weekData = JSON.parse(habit.weekData);
      weekData[day] = !weekData[day];
      await prisma.habit.update({
        where: { id },
        data: { weekData: JSON.stringify(weekData) },
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Error toggling habit day:", error);
      res.status(500).json({ error: "Erro ao atualizar hábito" });
    }
  }
);

router.delete(
  "/api/habits/:id",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const { id } = req.params;
      const habit = await prisma.habit.findFirst({ where: { id, userId } });
      if (!habit) {
        return res.status(404).json({ error: "Hábito não encontrado" });
      }
      await prisma.habit.delete({ where: { id } });
      res.json({ message: "Hábito excluído com sucesso" });
    } catch (error) {
      console.error("Error deleting habit:", error);
      res.status(500).json({ error: "Erro ao excluir hábito" });
    }
  }
);

export default router;
