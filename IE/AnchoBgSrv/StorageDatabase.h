#pragma once
#include <vector>
#include <string>
#include <stdexcept>
struct sqlite3;

class StorageDatabase
{
public:
  struct EStatementFailure: std::exception { };
  struct EDatabaseOpenFailure: std::exception { };
  struct EStepFailure: std::exception { };
  struct EUnexpectedColumnCount: std::exception { };
  struct EItemNotFound: std::exception { };

  typedef std::vector<std::wstring> Keys;
  StorageDatabase();

  ~StorageDatabase();

  void setItem(const std::wstring &aKey, const std::wstring &aValue);

  void getItem(const std::wstring &aKey, std::wstring &aValue);

  void removeItem(const std::wstring &aKey);

  bool hasItem(const std::wstring &aKey);

  void getKeys(Keys &aKeys);

  void open(const std::wstring & aPath);

  void close();

  bool isOpened() {
    return m_Opened;
  }
protected:
  struct SQLiteStatement;

  static const int TIMEOUT = 1000;

  void createTable();
  std::wstring escapeString(const std::wstring &aStr);

  sqlite3 *m_pDatabase;
  std::wstring m_Path;
  std::wstring m_TableName;
  bool m_Opened;
};