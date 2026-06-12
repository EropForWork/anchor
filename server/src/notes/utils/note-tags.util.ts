import { BadRequestException } from '@nestjs/common';
import type { Prisma } from 'src/generated/prisma/client';
import type { PrismaService } from '../../prisma/prisma.service';

export type NoteTagRef = { id: string; userId: string };

/**
 * Build a Prisma tags update that only changes the requesting user's tags,
 * leaving other collaborators' tags on the note untouched.
 */
export function buildPerUserTagsUpdate(
  userId: string,
  currentTags: NoteTagRef[],
  newTagIds: string[],
): Prisma.NoteUpdateInput['tags'] | undefined {
  const currentUserTagIds = currentTags
    .filter((tag) => tag.userId === userId)
    .map((tag) => tag.id);

  const connectIds = newTagIds.filter((id) => !currentUserTagIds.includes(id));
  const disconnectIds = currentUserTagIds.filter(
    (id) => !newTagIds.includes(id),
  );

  const update: NonNullable<Prisma.NoteUpdateInput['tags']> = {};

  if (connectIds.length > 0) {
    update.connect = connectIds.map((id) => ({ id }));
  }
  if (disconnectIds.length > 0) {
    update.disconnect = disconnectIds.map((id) => ({ id }));
  }

  return Object.keys(update).length > 0 ? update : undefined;
}

export async function assertUserOwnsTags(
  prisma: Pick<PrismaService, 'tag'>,
  userId: string,
  tagIds: string[],
): Promise<void> {
  if (tagIds.length === 0) {
    return;
  }

  const ownedCount = await prisma.tag.count({
    where: { id: { in: tagIds }, userId, isDeleted: false },
  });

  if (ownedCount !== tagIds.length) {
    throw new BadRequestException(
      'One or more tags are invalid or not owned by you',
    );
  }
}
