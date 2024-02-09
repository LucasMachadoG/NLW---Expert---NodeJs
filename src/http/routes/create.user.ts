import z from "zod";
import { app } from "../../config/app";
import { prisma } from "../../lib/prisma.connection";

export async function createUser() {
  app.post("/user", async (request, reply) => {
    const createUserBodySchema = z.object({
      name: z.string(),
      email: z.string().email(),
      password: z.string().min(8)
    })

    const { name, email, password } = createUserBodySchema.parse(request.body)

    const user = await prisma.user.create({
      data: {
        name: name,
        email: email,
        password: password
      }
    })

    return reply.status(201).send({
      user
    })
  })
}