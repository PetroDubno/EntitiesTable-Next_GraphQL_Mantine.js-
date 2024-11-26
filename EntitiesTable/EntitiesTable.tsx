import { FC, useEffect, useState } from 'react';

import { sentenceCase, useAuthentication, usePaginationHelpers } from 'common';
import { useRetrievePaginatedEntitiesLazyQuery } from 'graphql-library';
import { useRouter } from 'next/router';
import {
  BizPayPagination,
  BizPayTable,
  createColumnHelper,
  getCoreRowModel,
  SortingState,
  TablePageLayout,
  Updater,
  useBizPayNotification,
  useReactTable,
} from 'ui';

import { Entity, EntitiesTableProps } from './EntitiesTable.types';

import { ProtectedRoute, useSignOut } from '../../hooks';

const EntitiesTable: FC<EntitiesTableProps> = ({ paginationOptions: { isPaginationEnabled = false, maxPageSize } }) => {
  const { getIsAuthenticated } = useAuthentication();
  const { displayErrorNotification } = useBizPayNotification();
  const {
    calculateRecordsToSkip,
    calculateTotalPages,
    canPaginate,
    generatePaginationResultsDescription,
    getInitialPageSize,
    getPageNumberFromQuerystring,
  } = usePaginationHelpers();
  const { push, query, route } = useRouter();
  const { signOut } = useSignOut();

  const [currentPageNumber, setCurrentPageNumber] = useState<number>(getPageNumberFromQuerystring(query.pageNumber));
  const [currentPageSize, setCurrentPageSize] = useState<number>(maxPageSize ?? getInitialPageSize());
  const [hasRetrievedData, setHasRetrievedData] = useState<boolean>(false);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [sortingState, setSortingState] = useState<SortingState>([
    {
      desc: true,
      id: 'createdAtUtc',
    },
  ]);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  const [executeRetrievePaginatedEntitiesQuery, { loading: isLoading }] = useRetrievePaginatedEntitiesLazyQuery({
    onCompleted: ({ retrievePaginatedEntities: { count, data } }) => {
      setHasRetrievedData(true);
      setEntities(data);
      setTotalPages(calculateTotalPages(currentPageSize, count));
      setTotalRecords(count);

      if (canPaginate(currentPageSize, count) && isPaginationEnabled) {
        push(`${route}?pageNumber=${currentPageNumber}`, undefined, {
          shallow: true,
        });
      }
    },
    onError: () => {
      displayErrorNotification({
        message: 'Unable to retrieve entities',
      });
    },
  });

  const getTableColumns = (records: number) => {
    const columnHelper = createColumnHelper<Entity>();
    const isSortingEnabled = records > 1;

    return [
      columnHelper.accessor('name', {
        cell: ({ getValue }) => getValue(),
        enableSorting: isSortingEnabled,
        header: 'Name',
        minSize: 0,
        size: 0,
        sortDescFirst: false,
      }),
      columnHelper.accessor('abn', {
        cell: ({ getValue }) => getValue() ?? '-',
        enableSorting: isSortingEnabled,
        header: 'ABN',
        size: 100,
      }),
      columnHelper.accessor('acn', {
        cell: ({ getValue }) => getValue() ?? '-',
        enableSorting: isSortingEnabled,
        header: 'ACN',
        size: 100,
      }),
      columnHelper.accessor('type.name', {
        cell: ({ getValue }) => sentenceCase(getValue()),
        enableSorting: false,
        header: 'Entity type',
        size: 250,
        sortDescFirst: false,
      }),
      columnHelper.accessor('status', {
        cell: ({ getValue }) => sentenceCase(getValue()),
        enableSorting: isSortingEnabled,
        header: 'Status',
        meta: {
          align: 'center',
        },
        size: 120,
        sortDescFirst: false,
      }),
      columnHelper.accessor('createdAtUtc', {
        cell: ({ getValue }) => new Date(getValue()).toLocaleString(),
        enableSorting: isSortingEnabled,
        header: 'Date created',
        size: 200,
        sortDescFirst: false,
      }),
    ];
  };

  const handleEntityClick = ({ id }: Entity) => {
    const returnRoute = `${route}?pageNumber=${currentPageNumber}`;
    push(`${ProtectedRoute.Entities}/${id}?returnRoute=${encodeURIComponent(returnRoute)}`);
  };

  const handlePageNumberChange = (number: number) => {
    setCurrentPageNumber(number);
  };

  const handleSortColumnChange = (sortingState: Updater<SortingState>) => {
    setCurrentPageNumber(1);
    setSortingState(sortingState);
  };

  const [firstSortingState] = sortingState;
  const { desc: isDescendingSort, id: sortField } = firstSortingState ?? {};

  const { getHeaderGroups, getRowModel } = useReactTable<Entity>({
    columns: getTableColumns(totalRecords),
    data: entities,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    onSortingChange: handleSortColumnChange,
    state: {
      sorting: sortingState,
    },
  });

  const isAuthenticated = getIsAuthenticated();

  useEffect(() => {
    if (!isAuthenticated) {
      signOut();
      return;
    }

    executeRetrievePaginatedEntitiesQuery({
      variables: {
        pagination: {
          skip: calculateRecordsToSkip(isPaginationEnabled, currentPageNumber, currentPageSize),
          take: currentPageSize,
        },
        sort: {
          field: sortField,
          isDescending: isDescendingSort,
        },
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPageNumber, currentPageSize, isAuthenticated, isDescendingSort, sortField]);

  return (
    <TablePageLayout
      loadingMessage={isLoading ? 'Retrieving entities...' : undefined}
      paginationComponent={
        <BizPayPagination
          description={generatePaginationResultsDescription(
            isPaginationEnabled,
            currentPageNumber,
            currentPageSize,
            calculateRecordsToSkip(isPaginationEnabled, currentPageNumber, currentPageSize),
            totalRecords,
          )}
          hasRetrievedData={hasRetrievedData}
          isEnabled={isPaginationEnabled}
          pageSize={currentPageSize}
          totalPages={totalPages}
          totalRecords={totalRecords}
          value={currentPageNumber}
          onChange={handlePageNumberChange}
        />
      }
      tableComponent={
        <BizPayTable<Entity>
          hasRetrievedData={hasRetrievedData}
          headerGroups={getHeaderGroups()}
          rowModel={getRowModel()}
          onRowClick={handleEntityClick}
        />
      }
    />
  );
};

export { EntitiesTable };
