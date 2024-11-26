import { DocumentNode, gql } from 'graphql-library';

const retrievePaginatedEntitiesQuery: DocumentNode = gql`
  query retrievePaginatedEntities($pagination: PaginationInput!, $sort: SortInput!) {
    retrievePaginatedEntities(pagination: $pagination, sort: $sort) {
      count
      data {
        abn
        acn
        createdAtUtc
        id
        name
        type {
          code
          name
        }
        status
      }
    }
  }
`;

export { retrievePaginatedEntitiesQuery };
