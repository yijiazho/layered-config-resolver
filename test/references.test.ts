import { parseReferences } from '../src/references';

describe('parseReferences', () => {
  test('parses an absolute path from the document root', () => {
    expect(parseReferences('${outputs.database.endpoint}')).toEqual({
      text: '${outputs.database.endpoint}',
      references: [
        {
          syntax: '${outputs.database.endpoint}',
          scopePrefix: '',
          path: 'outputs.database.endpoint',
          isAbsolute: true,
        },
      ],
    });
  });

  test.each([
    ['${.host}', '.', 'host'],
    ['${..port}', '..', 'port'],
    ['${...key}', '...', 'key'],
  ])('parses relative reference %s', (syntax, scopePrefix, referencePath) => {
    expect(parseReferences(syntax).references).toEqual([
      {
        syntax,
        scopePrefix,
        path: referencePath,
        isAbsolute: false,
      },
    ]);
  });

  test('finds multiple references embedded in one string', () => {
    const value = 'prefix-${.a}-middle-${.b}-suffix';

    expect(parseReferences(value)).toEqual({
      text: value,
      references: [
        {
          syntax: '${.a}',
          scopePrefix: '.',
          path: 'a',
          isAbsolute: false,
        },
        {
          syntax: '${.b}',
          scopePrefix: '.',
          path: 'b',
          isAbsolute: false,
        },
      ],
    });
  });

  test('returns no references for plain text', () => {
    expect(parseReferences('plain string')).toEqual({
      text: 'plain string',
      references: [],
    });
  });

  test('ignores escaped reference syntax', () => {
    expect(parseReferences('literal $${outputs.secret}')).toEqual({
      text: 'literal $${outputs.secret}',
      references: [],
    });
  });

  test.each(['${}', '${.}', '${outputs..endpoint}', '${unterminated'])(
    'rejects malformed reference syntax %s',
    (value) => {
      expect(() => parseReferences(value)).toThrow(`Malformed reference in '${value}'`);
    },
  );
});
