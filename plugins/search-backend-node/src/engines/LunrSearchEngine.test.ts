/*
 * Copyright 2021 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { getVoidLogger } from '@backstage/backend-common';
import lunr from 'lunr';
import { SearchEngine } from '@backstage/search-common';
import {
  ConcreteLunrQuery,
  LunrSearchEngine,
  decodePageCursor,
  encodePageCursor,
} from './LunrSearchEngine';

/**
 * Just used to test the default translator shipped with LunrSearchEngine.
 */
class LunrSearchEngineForTranslatorTests extends LunrSearchEngine {
  getTranslator() {
    return this.translator;
  }
}

describe('LunrSearchEngine', () => {
  let testLunrSearchEngine: SearchEngine;

  beforeEach(() => {
    testLunrSearchEngine = new LunrSearchEngine({ logger: getVoidLogger() });
  });

  describe('translator', () => {
    it('query translator invoked', async () => {
      // Given: Set a translator spy on the search engine.
      const translatorSpy = jest.fn().mockReturnValue({
        lunrQueryString: '',
        documentTypes: [],
      });
      testLunrSearchEngine.setTranslator(translatorSpy);

      // When: querying the search engine
      await testLunrSearchEngine.query({
        term: 'testTerm',
        filters: {},
        pageCursor: 'MQ==',
      });

      // Then: the translator is invoked with expected args.
      expect(translatorSpy).toHaveBeenCalledWith({
        term: 'testTerm',
        filters: {},
        pageCursor: 'MQ==',
      });
    });

    it('should return translated query', async () => {
      const inspectableSearchEngine = new LunrSearchEngineForTranslatorTests({
        logger: getVoidLogger(),
      });
      const translatorUnderTest = inspectableSearchEngine.getTranslator();

      const actualTranslatedQuery = translatorUnderTest({
        term: 'testTerm',
        filters: {},
      }) as ConcreteLunrQuery;

      expect(actualTranslatedQuery).toMatchObject({
        documentTypes: undefined,
        lunrQueryBuilder: expect.any(Function),
        pageSize: 25,
      });

      const query: jest.Mocked<lunr.Query> = {
        allFields: [],
        clauses: [],
        term: jest.fn(),
        clause: jest.fn(),
      };

      actualTranslatedQuery.lunrQueryBuilder.bind(query)(query);

      expect(query.term).toBeCalledWith(lunr.tokenizer('testTerm'), {
        boost: 100,
        usePipeline: true,
      });
      expect(query.term).toBeCalledWith(lunr.tokenizer('testTerm'), {
        boost: 10,
        usePipeline: false,
        wildcard: lunr.Query.wildcard.TRAILING,
      });
      expect(query.term).toBeCalledWith(lunr.tokenizer('testTerm'), {
        boost: 1,
        usePipeline: false,
        editDistance: 2,
      });
    });

    it('should have default offset and limit', async () => {
      const inspectableSearchEngine = new LunrSearchEngineForTranslatorTests({
        logger: getVoidLogger(),
      });
      const translatorUnderTest = inspectableSearchEngine.getTranslator();

      const actualTranslatedQuery = translatorUnderTest({
        term: 'testTerm',
      }) as ConcreteLunrQuery;

      expect(actualTranslatedQuery).toMatchObject({
        documentTypes: undefined,
        lunrQueryBuilder: expect.any(Function),
        pageSize: 25,
      });

      const query: jest.Mocked<lunr.Query> = {
        allFields: [],
        clauses: [],
        term: jest.fn(),
        clause: jest.fn(),
      };

      actualTranslatedQuery.lunrQueryBuilder.bind(query)(query);

      expect(query.term).toBeCalledWith(lunr.tokenizer('testTerm'), {
        boost: 100,
        usePipeline: true,
      });
      expect(query.term).toBeCalledWith(lunr.tokenizer('testTerm'), {
        boost: 10,
        usePipeline: false,
        wildcard: lunr.Query.wildcard.TRAILING,
      });
      expect(query.term).toBeCalledWith(lunr.tokenizer('testTerm'), {
        boost: 1,
        usePipeline: false,
        editDistance: 2,
      });
    });

    it('should return translated query with 1 filter', async () => {
      const inspectableSearchEngine = new LunrSearchEngineForTranslatorTests({
        logger: getVoidLogger(),
      });
      const translatorUnderTest = inspectableSearchEngine.getTranslator();

      const actualTranslatedQuery = translatorUnderTest({
        term: 'testTerm',
        filters: { kind: 'testKind' },
      }) as ConcreteLunrQuery;

      expect(actualTranslatedQuery).toMatchObject({
        documentTypes: undefined,
        lunrQueryBuilder: expect.any(Function),
      });

      const query: jest.Mocked<lunr.Query> = {
        allFields: ['kind'],
        clauses: [],
        term: jest.fn(),
        clause: jest.fn(),
      };

      actualTranslatedQuery.lunrQueryBuilder.bind(query)(query);

      expect(query.term).toBeCalledWith(lunr.tokenizer('testTerm'), {
        boost: 100,
        usePipeline: true,
      });
      expect(query.term).toBeCalledWith(lunr.tokenizer('testTerm'), {
        boost: 10,
        usePipeline: false,
        wildcard: lunr.Query.wildcard.TRAILING,
      });
      expect(query.term).toBeCalledWith(lunr.tokenizer('testTerm'), {
        boost: 1,
        usePipeline: false,
        editDistance: 2,
      });
      expect(query.term).toBeCalledWith(lunr.tokenizer('testKind'), {
        fields: ['kind'],
        presence: lunr.Query.presence.REQUIRED,
      });
    });

    it('should return translated query with multiple filters', async () => {
      const inspectableSearchEngine = new LunrSearchEngineForTranslatorTests({
        logger: getVoidLogger(),
      });
      const translatorUnderTest = inspectableSearchEngine.getTranslator();

      const actualTranslatedQuery = translatorUnderTest({
        term: 'testTerm',
        filters: { kind: 'testKind', namespace: 'testNameSpace' },
      }) as ConcreteLunrQuery;

      expect(actualTranslatedQuery).toMatchObject({
        documentTypes: undefined,
        lunrQueryBuilder: expect.any(Function),
      });

      const query: jest.Mocked<lunr.Query> = {
        allFields: ['kind', 'namespace'],
        clauses: [],
        term: jest.fn(),
        clause: jest.fn(),
      };

      actualTranslatedQuery.lunrQueryBuilder.bind(query)(query);

      expect(query.term).toBeCalledWith(lunr.tokenizer('testTerm'), {
        boost: 100,
        usePipeline: true,
      });
      expect(query.term).toBeCalledWith(lunr.tokenizer('testTerm'), {
        boost: 10,
        usePipeline: false,
        wildcard: lunr.Query.wildcard.TRAILING,
      });
      expect(query.term).toBeCalledWith(lunr.tokenizer('testTerm'), {
        boost: 1,
        usePipeline: false,
        editDistance: 2,
      });
      expect(query.term).toBeCalledWith(lunr.tokenizer('testKind'), {
        fields: ['kind'],
        presence: lunr.Query.presence.REQUIRED,
      });
      expect(query.term).toBeCalledWith(lunr.tokenizer('testNameSpace'), {
        fields: ['namespace'],
        presence: lunr.Query.presence.REQUIRED,
      });
    });

    it('should throw if translated query references missing field', async () => {
      const inspectableSearchEngine = new LunrSearchEngineForTranslatorTests({
        logger: getVoidLogger(),
      });
      const translatorUnderTest = inspectableSearchEngine.getTranslator();

      const actualTranslatedQuery = translatorUnderTest({
        term: 'testTerm',
        filters: { kind: 'testKind' },
      }) as ConcreteLunrQuery;

      expect(actualTranslatedQuery).toMatchObject({
        documentTypes: undefined,
        lunrQueryBuilder: expect.any(Function),
      });

      const query: jest.Mocked<lunr.Query> = {
        allFields: [],
        clauses: [],
        term: jest.fn(),
        clause: jest.fn(),
      };

      expect(() =>
        actualTranslatedQuery.lunrQueryBuilder.bind(query)(query),
      ).toThrow();
    });
  });

  describe('query', () => {
    it('should perform search query and return 0 results on empty index', async () => {
      const querySpy = jest.spyOn(testLunrSearchEngine, 'query');

      // Perform search query and ensure the query func was invoked.
      const mockedSearchResult = await testLunrSearchEngine.query({
        term: 'testTerm',
        filters: {},
      });

      expect(querySpy).toHaveBeenCalled();
      expect(querySpy).toHaveBeenCalledWith({
        term: 'testTerm',
        filters: {},
      });

      // Should return 0 results as nothing is indexed here
      expect(mockedSearchResult).toMatchObject({
        results: [],
        nextPageCursor: undefined,
      });
    });

    it('should perform search query and return 0 results on no match', async () => {
      const mockDocuments = [
        {
          title: 'testTitle',
          text: 'testText',
          location: 'test/location',
        },
      ];

      // Mock indexing of 1 document
      await testLunrSearchEngine.index('test-index', mockDocuments);

      // Perform search query
      const mockedSearchResult = await testLunrSearchEngine.query({
        term: 'unknown',
        filters: {},
      });

      // Should return 0 results as we are mocking the indexing of 1 document but with no match on the fields
      expect(mockedSearchResult).toMatchObject({
        results: [],
        nextPageCursor: undefined,
      });
    });

    it('should perform search query and return all results on empty term', async () => {
      const mockDocuments = [
        {
          title: 'testTitle',
          text: 'testText',
          location: 'test/location',
        },
      ];

      // Mock indexing of 1 document
      await testLunrSearchEngine.index('test-index', mockDocuments);

      // Perform search query
      const mockedSearchResult = await testLunrSearchEngine.query({
        term: '',
        filters: {},
      });

      expect(mockedSearchResult).toMatchObject({
        results: [
          {
            document: {
              title: 'testTitle',
              text: 'testText',
              location: 'test/location',
            },
            type: 'test-index',
          },
        ],
        nextPageCursor: undefined,
      });
    });

    it('should perform search query and return search results on match', async () => {
      const mockDocuments = [
        {
          title: 'testTitle',
          text: 'testText',
          location: 'test/location',
        },
      ];

      // Mock indexing of 1 document
      await testLunrSearchEngine.index('test-index', mockDocuments);

      // Perform search query
      const mockedSearchResult = await testLunrSearchEngine.query({
        term: 'testTitle',
        filters: {},
      });

      expect(mockedSearchResult).toMatchObject({
        results: [
          {
            document: {
              title: 'testTitle',
              text: 'testText',
              location: 'test/location',
            },
          },
        ],
        nextPageCursor: undefined,
      });
    });

    it('should perform search query and return search results on partial match', async () => {
      const mockDocuments = [
        {
          title: 'testTitle',
          text: 'testText',
          location: 'test/location',
        },
      ];

      // Mock indexing of 1 document
      await testLunrSearchEngine.index('test-index', mockDocuments);

      // Perform search query
      const mockedSearchResult = await testLunrSearchEngine.query({
        term: 'testTitle',
        filters: {},
      });

      expect(mockedSearchResult).toMatchObject({
        results: [
          {
            document: {
              title: 'testTitle',
              text: 'testText',
              location: 'test/location',
            },
          },
        ],
        nextPageCursor: undefined,
      });
    });

    it('should perform search query and return search results on fuzzy match', async () => {
      const mockDocuments = [
        {
          title: 'testTitle',
          text: 'testText',
          location: 'test/location',
        },
      ];

      // Mock indexing of 1 document
      await testLunrSearchEngine.index('test-index', mockDocuments);

      // Perform search query
      const mockedSearchResult = await testLunrSearchEngine.query({
        term: 'testTitel', // Intentional typo
        filters: {},
      });

      // Should return 1 result as we are mocking the indexing of 1 document with match on the title field
      expect(mockedSearchResult).toMatchObject({
        results: [
          {
            document: {
              title: 'testTitle',
              text: 'testText',
              location: 'test/location',
            },
          },
        ],
        nextPageCursor: undefined,
      });
    });

    it('should perform search query with trailing punctuation and return search results on match (trimming)', async () => {
      const mockDocuments = [
        {
          title: 'testTitle',
          text: 'Hello World.',
          location: 'test/location',
        },
      ];

      // Mock indexing of 1 document
      await testLunrSearchEngine.index('test-index', mockDocuments);

      // Perform search query
      const mockedSearchResult = await testLunrSearchEngine.query({
        term: 'World',
        filters: {},
      });

      // Should return 1 result as we are mocking the indexing of 1 document with match on the title field
      expect(mockedSearchResult).toMatchObject({
        results: [
          {
            document: {
              title: 'testTitle',
              text: 'Hello World.',
              location: 'test/location',
            },
          },
        ],
        nextPageCursor: undefined,
      });
    });

    it('should perform search query by similar words and return search results on match (stemming)', async () => {
      const mockDocuments = [
        {
          title: 'testTitle',
          text: 'Searching',
          location: 'test/location',
        },
      ];

      // Mock indexing of 1 document
      await testLunrSearchEngine.index('test-index', mockDocuments);

      // Perform search query
      const mockedSearchResult = await testLunrSearchEngine.query({
        term: 'Search',
        filters: {},
      });

      // Should return 1 result as we are mocking the indexing of 1 document with match on the title field
      expect(mockedSearchResult).toMatchObject({
        results: [
          {
            document: {
              title: 'testTitle',
              text: 'Searching',
              location: 'test/location',
            },
          },
        ],
        nextPageCursor: undefined,
      });
    });

    it('should perform search query and return search results on match with filters', async () => {
      const mockDocuments = [
        {
          title: 'testTitle',
          text: 'testText',
          location: 'test/location',
        },
        {
          title: 'testTitle',
          text: 'testText',
          location: 'test/location2',
        },
      ];

      // Mock indexing of 2 documents
      await testLunrSearchEngine.index('test-index', mockDocuments);

      // Perform search query
      const mockedSearchResult = await testLunrSearchEngine.query({
        term: 'testTitle',
        filters: { location: 'test/location2' },
      });

      // Should return 1 of 2 results as we are
      // 1. Mocking the indexing of 2 documents
      // 2. Matching on the location field with the filter { location: 'test/location2' }
      expect(mockedSearchResult).toMatchObject({
        results: [
          {
            document: {
              title: 'testTitle',
              text: 'testText',
              location: 'test/location2',
            },
          },
        ],
        nextPageCursor: undefined,
      });
    });

    it('should perform search query and return search results on match with filter and not fail on missing field', async () => {
      const mockDocuments = [
        {
          title: 'testTitle',
          text: 'testText',
          location: 'test/location',
        },
      ];

      const mockDocuments2 = [
        {
          title: 'testTitle',
          text: 'testText',
          location: 'test/location2',
          extraField: 'testExtraField',
        },
      ];

      // Mock 2 indices with 1 document each
      await testLunrSearchEngine.index('test-index', mockDocuments);
      await testLunrSearchEngine.index('test-index-2', mockDocuments2);
      // Perform search query scoped to "test-index-2" with a filter on the field "extraField"
      const mockedSearchResult = await testLunrSearchEngine.query({
        term: 'testTitle',
        filters: { extraField: 'testExtraField' },
      });

      expect(mockedSearchResult).toMatchObject({
        results: [
          {
            document: {
              title: 'testTitle',
              text: 'testText',
              location: 'test/location2',
              extraField: 'testExtraField',
            },
          },
        ],
        nextPageCursor: undefined,
      });
    });

    it('should perform search query and return search results on match with filters that include a : character', async () => {
      const mockDocuments = [
        {
          title: 'testTitle',
          text: 'testText',
          location: 'test:location',
        },
        {
          title: 'testTitle',
          text: 'testText',
          location: 'test:location2',
        },
      ];

      // Mock indexing of 2 documents
      await testLunrSearchEngine.index('test-index', mockDocuments);

      // Perform search query
      const mockedSearchResult = await testLunrSearchEngine.query({
        term: 'testTitle',
        filters: { location: 'test:location2' },
      });

      // Should return 1 of 2 results as we are
      // 1. Mocking the indexing of 2 documents
      // 2. Matching on the location field with the filter { location: 'test:location2' }
      expect(mockedSearchResult).toMatchObject({
        results: [
          {
            document: {
              title: 'testTitle',
              text: 'testText',
              location: 'test:location2',
            },
          },
        ],
        nextPageCursor: undefined,
      });
    });

    it('should perform search query and return search results on match, scoped to specific index', async () => {
      const mockDocuments = [
        {
          title: 'testTitle',
          text: 'testText',
          location: 'test/location',
        },
        {
          title: 'testTitle',
          text: 'testText',
          location: 'test/location2',
        },
      ];

      const mockDocuments2 = [
        {
          title: 'testTitle',
          text: 'testText',
          location: 'test/location3',
        },
        {
          title: 'testTitle',
          text: 'testText',
          location: 'test/location4',
        },
      ];

      // Mock 2 indices with 2 documents each
      await testLunrSearchEngine.index('test-index', mockDocuments);
      await testLunrSearchEngine.index('test-index-2', mockDocuments2);

      // Perform search query scoped to "test-index-2"
      const mockedSearchResult = await testLunrSearchEngine.query({
        term: 'testTitle',
        types: ['test-index-2'],
      });

      expect(mockedSearchResult).toMatchObject({
        results: [
          {
            document: {
              location: 'test/location3',
              text: 'testText',
              title: 'testTitle',
            },
          },
          {
            document: {
              location: 'test/location4',
              text: 'testText',
              title: 'testTitle',
            },
          },
        ],
        nextPageCursor: undefined,
      });
    });

    it('should return next page cursor if results exceed page size', async () => {
      const mockDocuments = Array(30)
        .fill(0)
        .map((_, i) => ({
          title: 'testTitle',
          text: 'testText',
          location: `test/location/${i}`,
        }));

      await testLunrSearchEngine.index('test-index', mockDocuments);

      const mockedSearchResult = await testLunrSearchEngine.query({
        term: 'testTitle',
        types: ['test-index'],
      });

      expect(mockedSearchResult).toMatchObject({
        results: Array(25)
          .fill(0)
          .map((_, i) => ({
            document: {
              title: 'testTitle',
              text: 'testText',
              location: `test/location/${i}`,
            },
            type: 'test-index',
          })),
        nextPageCursor: 'MQ==',
        previousPageCursor: undefined,
      });
    });
  });

  it('should return previous page cursor if on another page', async () => {
    const mockDocuments = Array(30)
      .fill(0)
      .map((_, i) => ({
        title: 'testTitle',
        text: 'testText',
        location: `test/location/${i}`,
      }));

    await testLunrSearchEngine.index('test-index', mockDocuments);

    const mockedSearchResult = await testLunrSearchEngine.query({
      term: 'testTitle',
      types: ['test-index'],
      pageCursor: 'MQ==',
    });

    expect(mockedSearchResult).toMatchObject({
      results: Array(30)
        .fill(0)
        .map((_, i) => ({
          document: {
            title: 'testTitle',
            text: 'testText',
            location: `test/location/${i}`,
          },
          type: 'test-index',
        }))
        .slice(25),
      nextPageCursor: undefined,
      previousPageCursor: 'MA==',
    });
  });

  describe('index', () => {
    it('should index document', async () => {
      const indexSpy = jest.spyOn(testLunrSearchEngine, 'index');
      const mockDocuments = [
        {
          title: 'testTerm',
          text: 'testText',
          location: 'test/location',
        },
      ];

      // call index func and ensure the index func was invoked.
      await testLunrSearchEngine.index('test-index', mockDocuments);
      expect(indexSpy).toHaveBeenCalled();
      expect(indexSpy).toHaveBeenCalledWith('test-index', [
        { title: 'testTerm', text: 'testText', location: 'test/location' },
      ]);
    });
  });
});

describe('decodePageCursor', () => {
  test('should decode page', () => {
    expect(decodePageCursor('MQ==')).toEqual({ page: 1 });
  });

  test('should fallback to first page if empty', () => {
    expect(decodePageCursor()).toEqual({ page: 0 });
  });
});

describe('encodePageCursor', () => {
  test('should encode page', () => {
    expect(encodePageCursor({ page: 1 })).toEqual('MQ==');
  });
});
