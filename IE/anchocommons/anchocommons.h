#pragma once

#include <string>

extern const wchar_t * s_AnchoMainAPIModuleID;
extern const wchar_t * s_AnchoExtensionsRegistryKey;
extern const wchar_t * s_AnchoExtensionsRegistryEntryGUID;
extern const wchar_t * s_AnchoExtensionsRegistryEntryFlags;
extern const wchar_t * s_AnchoExtensionsRegistryEntryPath;
extern const wchar_t * s_AnchoProtocolHandlerScheme;
extern const wchar_t * s_AnchoProtocolHandlerPrefix;
extern const wchar_t * s_AnchoGlobalAPIObjectName;
extern const wchar_t * s_AnchoServiceAPIName;
extern const wchar_t * s_AnchoBackgroundAPIObjectName;
extern const wchar_t * s_AnchoBackgroundPageAPIName;
extern const wchar_t * s_AnchoBackgroundConsoleObjectName;
extern const wchar_t * s_AnchoFnGetContentAPI;
extern const wchar_t * s_AnchoFnReleaseContentAPI;
extern const wchar_t * s_AnchoTabIDPropertyName;


#include <SHTypes.h>
bool isExtensionPage(const std::wstring &aUrl);
std::wstring getDomainName(const std::wstring &aUrl);
std::wstring getSystemPathWithFallback(REFKNOWNFOLDERID aKnownFolderID, int aCLSID);

std::wstring stringFromCLSID(const CLSID &aCLSID);
std::wstring stringFromGUID2(const GUID &aGUID);


inline std::wstring stripFragmentFromUrl(std::wstring aUrl)
{
  size_t pos = aUrl.find_first_of(L'#');
  if (pos != std::wstring::npos) {
    aUrl.erase(pos);
  }
  return aUrl;
}

inline int getWindowZOrder(HWND hWnd)
{
    int z = 0;
    for (HWND h = hWnd; h != NULL; h = ::GetWindow(h, GW_HWNDPREV)) {
      ++z;
    }
    return z;
}

struct ZOrderComparator
{
  bool operator()(HWND aFirst, HWND aSecond) const
  {
    return getWindowZOrder(aFirst) < getWindowZOrder(aSecond);
  }
};

