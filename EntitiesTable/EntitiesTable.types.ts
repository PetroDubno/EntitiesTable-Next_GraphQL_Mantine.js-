import { PaginationOptions } from 'common';
import { RetrievePaginatedEntitiesQuery } from 'graphql-library';

export type Entity = RetrievePaginatedEntitiesQuery['retrievePaginatedEntities']['data'][0];

export interface EntitiesTableProps extends PaginationOptions {}
