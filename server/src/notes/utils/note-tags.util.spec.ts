import { buildPerUserTagsUpdate } from './note-tags.util';

describe('buildPerUserTagsUpdate', () => {
  const ownerId = 'owner';
  const editorId = 'editor';

  it('connects new tags for the requesting user', () => {
    const result = buildPerUserTagsUpdate(ownerId, [], ['tag-a']);

    expect(result).toEqual({
      connect: [{ id: 'tag-a' }],
    });
  });

  it('disconnects removed tags for the requesting user', () => {
    const result = buildPerUserTagsUpdate(
      ownerId,
      [{ id: 'tag-a', userId: ownerId }],
      [],
    );

    expect(result).toEqual({
      disconnect: [{ id: 'tag-a' }],
    });
  });

  it('leaves other users tags untouched when editor updates their tags', () => {
    const result = buildPerUserTagsUpdate(
      editorId,
      [
        { id: 'owner-tag', userId: ownerId },
        { id: 'editor-tag-old', userId: editorId },
      ],
      ['editor-tag-new'],
    );

    expect(result).toEqual({
      connect: [{ id: 'editor-tag-new' }],
      disconnect: [{ id: 'editor-tag-old' }],
    });
  });

  it('returns undefined when the user tag set is unchanged', () => {
    const result = buildPerUserTagsUpdate(
      ownerId,
      [
        { id: 'owner-tag', userId: ownerId },
        { id: 'editor-tag', userId: editorId },
      ],
      ['owner-tag'],
    );

    expect(result).toBeUndefined();
  });

  it('allows owner to replace only their tags on a shared note', () => {
    const result = buildPerUserTagsUpdate(
      ownerId,
      [
        { id: 'owner-tag-old', userId: ownerId },
        { id: 'editor-tag', userId: editorId },
      ],
      ['owner-tag-new'],
    );

    expect(result).toEqual({
      connect: [{ id: 'owner-tag-new' }],
      disconnect: [{ id: 'owner-tag-old' }],
    });
  });
});
