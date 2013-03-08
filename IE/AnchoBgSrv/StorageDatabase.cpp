#include "stdafx.h"
#include "StorageDatabase.h"
#include "sqlite3.h"

//RAII wrapper for SQLite statement
struct StorageDatabase::SQLiteStatement
{
  SQLiteStatement(): statement(NULL)
  { /*empty*/ }

  SQLiteStatement(sqlite3 *aDb, const std::wstring &aQuery): statement(NULL)
  { prepare(aDb, aQuery); }

  ~SQLiteStatement()
  {
    if (statement) {
      sqlite3_finalize(statement);
    }
  }

  sqlite3_stmt *&get()
  { return statement; }

  void prepare(sqlite3 *aDb, const std::wstring &aQuery)
  {
    if (sqlite3_prepare16_v2(aDb, aQuery.c_str(), -1, &statement, 0) != SQLITE_OK) {
      ANCHO_THROW(EStatementFailure());
    }
  }

  int step()
  {
    int res = sqlite3_step(statement);
    if (res != SQLITE_DONE && res != SQLITE_ROW) {
      ANCHO_THROW(EStepFailure());
    }
    return res;
  }

  void stepDone()
  {
    if (sqlite3_step(statement) != SQLITE_DONE) {
      ANCHO_THROW(EStepFailure());
    }
  }

  int columnCount()
  { return sqlite3_column_count(statement); }

  sqlite3_stmt *statement;
};


StorageDatabase::StorageDatabase()
: mDatabase(NULL), mPath(), mTableName(), mOpened(false)
{
}

StorageDatabase::~StorageDatabase()
{
    close();
}

void StorageDatabase::setItem(const std::wstring &aKey, const std::wstring &aValue)
{
  std::wostringstream query;
  query << L"INSERT OR REPLACE INTO "
        << mTableName << " (key, value) VALUES('"
        << escapeString(aKey) << L"','" << escapeString(aValue)
        << L"');";

  SQLiteStatement statement(mDatabase, query.str());
  statement.stepDone();
}

void StorageDatabase::getItem(const std::wstring &aKey, std::wstring &aValue)
{
  std::wostringstream query;
  query << L"SELECT * FROM "
        << mTableName << L" WHERE key='"
        << escapeString(aKey) << L"';";

  SQLiteStatement statement(mDatabase, query.str());

  int cols = sqlite3_column_count(statement.get());
  if( cols != 2 ) {
    ANCHO_THROW(EUnexpectedColumnCount());
  }
  int rv = statement.step();
  if (rv == SQLITE_ROW) {
    aValue = static_cast<const wchar_t*>(sqlite3_column_text16(statement.get(), 1));
  } else {
    ANCHO_THROW(EItemNotFound());
  }
}

void StorageDatabase::removeItem(const std::wstring &aKey)
{
  std::wostringstream query;
  query << L"DELETE FROM "
        << mTableName << L" WHERE key='"
        << escapeString(aKey) << L"';";

  SQLiteStatement statement(mDatabase, query.str());
  statement.stepDone();
}

void StorageDatabase::getKeys(std::vector<std::wstring> &aKeys)
{
  std::wostringstream query;
  query << L"SELECT key FROM " << mTableName << L";";
  ATLASSERT(aKeys.empty());

  SQLiteStatement statement(mDatabase, query.str());

  int rv = statement.step();
  while (rv == SQLITE_ROW) {
    aKeys.push_back(static_cast<const wchar_t*>(sqlite3_column_text16(statement.get(), 0)));
    rv = statement.step();
  }
}

bool StorageDatabase::hasItem(const std::wstring &aKey)
{
  std::wostringstream query;
  query << L"SELECT count(*) FROM "
        << mTableName << L" WHERE key='"
        << escapeString(aKey) << L"';";

  SQLiteStatement statement(mDatabase, query.str());

  if(SQLITE_ROW == statement.step()) {
    int rowCount = 0;
    rowCount = sqlite3_column_int(statement.get(), 0);
    return rowCount > 0;
  }
  return false;
}

void StorageDatabase::clear()
{
  std::wostringstream query;
  query << L"DELETE FROM "
        << mTableName << L"';";

  SQLiteStatement statement(mDatabase, query.str());
  statement.stepDone();
}


void StorageDatabase::open(const std::wstring &aPath, const std::wstring & aTableName)
{
  mPath = aPath;
  mTableName = aTableName;
  if(SQLITE_OK != sqlite3_open16(mPath.c_str(), &mDatabase)) {
    ANCHO_THROW(EDatabaseOpenFailure());
  }
  mOpened = true;
  sqlite3_busy_timeout(mDatabase, TIMEOUT);
  ATLTRACE(L"SQL: Opened SQLite database file : %s \n", aPath.c_str());

  try {
    createTable();
  } catch(...) {
    close();
    throw;
  }
}

void StorageDatabase::close()
{
  if(mDatabase) {
    sqlite3_close(mDatabase);
  }
  mOpened = false;
}

void StorageDatabase::createTable()
{
  std::wostringstream query;
  query << L"CREATE TABLE IF NOT EXISTS "
        << mTableName << L"(key TEXT PRIMARY KEY, value TEXT);";

  SQLiteStatement statement(mDatabase, query.str());
  statement.stepDone();
}

std::wstring StorageDatabase::escapeString(const std::wstring &aStr)
{
  std::wstring result = aStr;

  size_t start = result.find_first_of(L'\'');
  while (start != std::wstring::npos) {
    result.insert(start, 1, L'\'');
    start = result.find_first_of(L'\'', start+=2);
  }
  return result;
}