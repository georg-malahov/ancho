#pragma once

struct WindowDocumentRecord
{
  WindowDocumentRecord()
    : window(NULL), tabId(-1)
  { /*empty*/ }

  WindowDocumentRecord(HWND aWindow, int aTabId, CComPtr<IWebBrowser2> aTopLevelBrowser, CComPtr<IWebBrowser2> aBrowser, CComPtr<IHTMLDocument2> aDocument)
    : window(aWindow), tabId(aTabId), topLevelBrowser(aTopLevelBrowser), browser(aBrowser), document(aDocument)
  { /*empty*/ }

  HWND window;
  int tabId;
  CComPtr<IWebBrowser2> topLevelBrowser;
  CComPtr<IWebBrowser2> browser;
  CComPtr<IHTMLDocument2> document;
};


class WindowDocumentMap
{
public:

  void eraseTab(int aTab)
  {
    CSLock lock(mAccessCriticalSection);
    for(WinDocMap::iterator it = mWindowMap.begin(); it != mWindowMap.end(); ) {
      if (it->second.tabId == aTab) {
        mWindowMap.erase(it++);
      } else {
        ++it;
      }
    }
  }

  void erase(HWND aHWND)
  {
    CSLock lock(mAccessCriticalSection);
    mWindowMap.erase(aHWND);
  }

  WindowDocumentRecord get(HWND aHWND)const
  {
    CSLock lock(mAccessCriticalSection);
    WinDocMap::const_iterator it = mWindowMap.find(aHWND);
    if (it != mWindowMap.end()) {
      return it->second;
    }
    return WindowDocumentRecord();
  }

  void put(const WindowDocumentRecord &aWindowRecord)
  {
    CSLock lock(mAccessCriticalSection);
    mWindowMap[aWindowRecord.window] = aWindowRecord;
  }
protected:
  typedef CComCritSecLock<CComAutoCriticalSection> CSLock;
  typedef std::map<HWND, WindowDocumentRecord> WinDocMap;

  WinDocMap mWindowMap;
  mutable CComAutoCriticalSection mAccessCriticalSection;
};

extern WindowDocumentMap gWindowDocumentMap;