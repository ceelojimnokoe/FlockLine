"use server";

import { getTransactions, type TransactionFilters } from "@/lib/data/giving";

export async function loadMoreTransactions(filters: TransactionFilters, offset: number) {
  return getTransactions(filters, offset);
}
