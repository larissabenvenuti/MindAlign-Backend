import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

router.get(
  "/api/calendar",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const eventsRaw = await prisma.event.findMany({
        where: { userId },
        orderBy: { start: "asc" },
      });
      const events = eventsRaw.map((ev) => ({
        ...ev,
        allDay: false,
      }));
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ error: "Erro ao buscar eventos" });
    }
  }
);

router.post(
  "/api/calendar",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const { title, start, end } = req.body;
      if (!title || !start || !end) {
        return res
          .status(400)
          .json({ error: "Título, início e término são obrigatórios" });
      }

      const event = await prisma.event.create({
        data: {
          title,
          start,
          end,
          userId,
        },
      });
      res.status(201).json(event);
    } catch (error) {
      console.error("Error creating event:", error);
      res.status(500).json({ error: "Erro ao criar evento" });
    }
  }
);

router.put(
  "/api/calendar/:id",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const { id } = req.params;
      const { title, start, end } = req.body;

      const existingEvent = await prisma.event.findFirst({
        where: { id, userId },
      });

      if (!existingEvent) {
        return res.status(404).json({ error: "Evento não encontrado" });
      }

      const event = await prisma.event.update({
        where: { id },
        data: {
          title,
          start: start,
          end: end,
        },
      });

      res.json(event);
    } catch (error) {
      console.error("Error updating event:", error);
      res.status(500).json({ error: "Erro ao atualizar evento" });
    }
  }
);

router.delete(
  "/api/calendar/:id",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      const existingEvent = await prisma.event.findFirst({
        where: { id, userId },
      });

      if (!existingEvent) {
        return res.status(404).json({ error: "Evento não encontrado" });
      }

      await prisma.event.delete({
        where: { id },
      });

      res.json({ message: "Evento excluído com sucesso" });
    } catch (error) {
      console.error("Error deleting event:", error);
      res.status(500).json({ error: "Erro ao excluir evento" });
    }
  }
);

export default router;
