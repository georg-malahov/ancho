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
: m_pDatabase(NULL), m_Path(), m_TableName(L"LocalStorage"), m_Opened(false)
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
        << m_TableName << " (key, value) VALUES('"
        << escapeString(aKey) << L"','" << escapeString(aValue)
        << L"');";

  SQLiteStatement statement(m_pDatabase, query.str());
  statement.stepDone();
  /*bool result = SQLITE_DONE == sqlite3_step(statement.get());

  if( !result ) {
    ATLTRACE(L"SQL: Setting an item failed: %s - %s\n",
      query.str().c_str(),
      static_cast<const wchar_t*>(sqlite3_errmsg16(m_pDatabase))
    );
  }
  return result;*/
}

void StorageDatabase::getItem(const std::wstring &aKey, std::wstring &aValue)
{
  std::wostringstream query;
  query << L"SELECT * FROM "
        << m_TableName << L" WHERE key='"
        << escapeString(aKey) << L"';";

  SQLiteStatement statement(m_pDatabase, query.str());

  int cols = sqlite3_column_count(statement.get());
  if( cols != 2 ) {
    ANCHO_THROW(EUnexpectedColumnCount());
  }
  int rv = statement.step(); //sqlite3_step(statement.get());
  if (rv == SQLITE_ROW) {
    aValue = static_cast<const wchar_t*>(sqlite3_column_text16(statement.get(), 1));
  } else {
    ANCHO_THROW(EItemNotFound());
  }

  /*if(!result) {
    ATLTRACE(L"SQL: Getting an item failed: %s - %s\n",
      query.str().c_str(),
      static_cast<const wchar_t*>(sqlite3_errmsg16(m_pDatabase))
    );
  }
  return result;*/
}

void StorageDatabase::removeItem(const std::wstring &aKey)
{
  std::wostringstream query;
  query << L"DELETE FROM "
        << m_TableName << L" WHERE key='"
        << escapeString(aKey) << L"';";

  SQLiteStatement statement(m_pDatabase, query.str());
  statement.stepDone();

  //bool result = SQLITE_DONE == sqlite3_step(statement.get());
  /*if (!result) {
    ATLTRACE(L"SQL: Removing an item failed: %s - %s\n",
      query.str().c_str(),
      static_cast<const wchar_t*>(sqlite3_errmsg16(m_pDatabase))
    );
  }
  return result;*/
}

void StorageDatabase::getKeys(std::vector<std::wstring> &aKeys)
{
  std::wostringstream query;
  query << L"SELECT key FROM " << m_TableName << L";";
  ATLASSERT(aKeys.empty());

  SQLiteStatement statement(m_pDatabase, query.str());

  //bool result = false;
  int rv = statement.step();
  while (rv == SQLITE_ROW) {
    aKeys.push_back(static_cast<const wchar_t*>(sqlite3_column_text16(statement.get(), 0)));
    rv = statement.step();
  }
  /*result = (rv == SQLITE_DONE);
  if (!result) {
    ATLTRACE(L"SQL: Getting keys failed: %s - %s\n",
      query.str().c_str(),
      static_cast<const wchar_t*>(sqlite3_errmsg16(m_pDatabase))
    );
  }
  return result;*/
}

bool StorageDatabase::hasItem(const std::wstring &aKey)
{
  std::wostringstream query;
  query << L"SELECT count(*) FROM "
        << m_TableName << L" WHERE key='"
        << escapeString(aKey) << L"';";

  SQLiteStatement statement(m_pDatabase, query.str());

  //bool result = false;
  if(SQLITE_ROW == statement.step()) {
    int rowCount = 0;
    rowCount = sqlite3_column_int(statement.get(), 0);
    return rowCount > 0;
  }
  return false;
  /*if (!result) {
    ATLTRACE(L"SQL: Checking item existence failed: %s - %s\n",
      query.str().c_str(),
      static_cast<const wchar_t*>(sqlite3_errmsg16(m_pDatabase))
    );
  }
  return result;*/
}


void StorageDatabase::open(const std::wstring &aPath)
{
  m_Path = aPath;
  if(SQLITE_OK != sqlite3_open16(m_Path.c_str(), &m_pDatabase)) {
    ANCHO_THROW(EDatabaseOpenFailure());
  }
  m_Opened = true;
  sqlite3_busy_timeout(m_pDatabase, TIMEOUT);
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
  if(m_pDatabase) {
    sqlite3_close(m_pDatabase);
  }
  m_Opened = false;
}

void StorageDatabase::createTable()
{
  std::wostringstream query;
  query << L"CREATE TABLE IF NOT EXISTS "
        << m_TableName << L"(key TEXT PRIMARY KEY, value TEXT);";

  SQLiteStatement statement(m_pDatabase, query.str());
  statement.stepDone();
  /*bool result = SQLITE_DONE == sqlite3_step(statement);

  if(!result) {
    ATLTRACE(L"SQL: Creating a table failed: %s - %s\n",
      query.str().c_str(),
      static_cast<const wchar_t*>(sqlite3_errmsg16(m_pDatabase))
    );
    //ANCHO_THROW
  }
  return result;*/
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