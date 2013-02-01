/****************************************************************************
 * AnchoRuntime.h : Declaration of the CAnchoRuntime
 * Copyright 2012 Salsita software (http://www.salsitasoft.com).
 * Author: Arne Seib <kontakt@seiberspace.de>
 ****************************************************************************/

#pragma once
#include "resource.h"       // main symbols

#include "ancho_i.h"

#include "SimpleWrappers.h"

#if defined(_WIN32_WCE) && !defined(_CE_DCOM) && !defined(_CE_ALLOW_SINGLE_THREADED_OBJECTS_IN_MTA)
#error "Single-threaded COM objects are not properly supported on Windows CE platform, such as the Windows Mobile platforms that do not include full DCOM support. Define _CE_ALLOW_SINGLE_THREADED_OBJECTS_IN_MTA to force ATL to support creating single-thread COM object's and allow use of it's single-threaded COM object implementations. The threading model in your rgs file was set to 'Free' as that is the only threading model supported in non DCOM Windows CE platforms."
#endif

/*============================================================================
 * class CAnchoRuntime
 */
class CAnchoRuntime;
typedef IDispEventImpl<1, CAnchoRuntime, &DIID_DWebBrowserEvents2, &LIBID_SHDocVw, 1, 0> TWebBrowserEvents;
typedef IDispEventImpl<2, CAnchoRuntime, &IID_DAnchoBrowserEvents, &LIBID_anchoLib, 0xffff, 0xffff> TAnchoBrowserEvents;

class ATL_NO_VTABLE CAnchoRuntime :
  public CComObjectRootEx<CComSingleThreadModel>,
  public CComCoClass<CAnchoRuntime, &CLSID_AnchoRuntime>,
  public IObjectWithSiteImpl<CAnchoRuntime>,
  public TWebBrowserEvents,
  public TAnchoBrowserEvents,
  public IAnchoRuntime
{
  typedef std::map<std::wstring, CComPtr<IWebBrowser2> > FrameMap;
public:
  // -------------------------------------------------------------------------
  // ctor
  CAnchoRuntime() : m_WebBrowserEventsCookie(0), m_AnchoBrowserEventsCookie(0), m_ExtensionPageAPIPrepared(false), m_IsExtensionPage(false)
  {
  }

  // -------------------------------------------------------------------------
  // COM standard stuff
  DECLARE_REGISTRY_RESOURCEID(IDR_ANCHORUNTIME)
  DECLARE_NOT_AGGREGATABLE(CAnchoRuntime)
  DECLARE_PROTECT_FINAL_CONSTRUCT()

  // -------------------------------------------------------------------------
  // COM interface map
  BEGIN_COM_MAP(CAnchoRuntime)
    COM_INTERFACE_ENTRY(IAnchoRuntime)
    COM_INTERFACE_ENTRY(IObjectWithSite)
  END_COM_MAP()

  // -------------------------------------------------------------------------
  // COM sink map
  BEGIN_SINK_MAP(CAnchoRuntime)
    SINK_ENTRY_EX(1, DIID_DWebBrowserEvents2, DISPID_BEFORENAVIGATE2, OnBrowserBeforeNavigate2)
    SINK_ENTRY_EX(1, DIID_DWebBrowserEvents2, DISPID_NAVIGATECOMPLETE2, OnNavigateComplete)
    SINK_ENTRY_EX(1, DIID_DWebBrowserEvents2, DISPID_PROGRESSCHANGE, OnBrowserProgressChange)
    SINK_ENTRY_EX(1, DIID_DWebBrowserEvents2, DISPID_DOWNLOADBEGIN, OnBrowserDownloadBegin)
    SINK_ENTRY_EX(2, IID_DAnchoBrowserEvents, 1, OnFrameStart)
    SINK_ENTRY_EX(2, IID_DAnchoBrowserEvents, 2, OnFrameEnd)
    SINK_ENTRY_EX(2, IID_DAnchoBrowserEvents, 3, OnFrameRedirect)

    SINK_ENTRY_EX(2, IID_DAnchoBrowserEvents, 4, OnBeforeRequest)
    SINK_ENTRY_EX(2, IID_DAnchoBrowserEvents, 5, OnBeforeSendHeaders)
  END_SINK_MAP()

  // -------------------------------------------------------------------------
  // COM standard methods
  HRESULT FinalConstruct()
  {
    return S_OK;
  }

  void FinalRelease()
  {
    DestroyAddons();
    Cleanup();
  }

public:
  // -------------------------------------------------------------------------
  // IObjectWithSiteImpl methods
  STDMETHOD(SetSite)(IUnknown *pUnkSite);

  // -------------------------------------------------------------------------
  // IAnchoRuntime methods
  STDMETHOD(reloadTab)();
  STDMETHOD(closeTab)();
  STDMETHOD(executeScript)(BSTR aExtensionId, BSTR aCode, INT aFileSpecified);
  STDMETHOD(updateTab)(LPDISPATCH aProperties);
  STDMETHOD(fillTabInfo)(VARIANT* aInfo);

  // DWebBrowserEvents2 methods
  STDMETHOD_(void, OnNavigateComplete)(LPDISPATCH pDispatch, VARIANT *URL);
  STDMETHOD_(void, OnBrowserBeforeNavigate2)(LPDISPATCH pDisp, VARIANT *pURL, VARIANT *Flags,
    VARIANT *TargetFrameName, VARIANT *PostData, VARIANT *Headers, BOOL *Cancel);

  STDMETHOD_(void, OnBrowserDownloadBegin)();
  STDMETHOD_(void, OnBrowserProgressChange)(LONG Progress, LONG ProgressMax);

  // -------------------------------------------------------------------------
  // DAnchoBrowserEvents methods.
  STDMETHOD(OnFrameStart)(BSTR bstrUrl, VARIANT_BOOL bIsMainFrame);
  STDMETHOD(OnFrameEnd)(BSTR bstrUrl, VARIANT_BOOL bIsMainFrame);
  STDMETHOD(OnFrameRedirect)(BSTR bstrOldUrl, BSTR bstrNewUrl);

  STDMETHOD(OnBeforeRequest)(VARIANT aReporter)
  {
    ATLASSERT(aReporter.vt == VT_UNKNOWN);
    CComBSTR str;
    CComQIPtr<IWebRequestReporter> reporter(aReporter.punkVal);
    if (!reporter) {
      return E_INVALIDARG;
    }
    BeforeRequestInfo outInfo;
    CComBSTR url;
    CComBSTR method;
    reporter->getUrl(&url);
    reporter->getHTTPMethod(&method);
    fireOnBeforeRequest(url.m_str, method.m_str, outInfo);
    if (outInfo.cancel) {
      reporter->cancelRequest();
    }
    if (outInfo.redirect) {
      reporter->redirectRequest(CComBSTR(outInfo.newUrl.c_str()));
    }
    return S_OK;
  }

  STDMETHOD(OnBeforeSendHeaders)(VARIANT aReporter)
  {
    ATLASSERT(aReporter.vt == VT_UNKNOWN);
    CComBSTR str;
    CComQIPtr<IWebRequestReporter> reporter(aReporter.punkVal);
    if (!reporter) {
      return E_INVALIDARG;
    }
    BeforeSendHeadersInfo outInfo;
    CComBSTR url;
    CComBSTR method;
    reporter->getUrl(&url);
    reporter->getHTTPMethod(&method);
    fireOnBeforeSendHeaders(url.m_str, method.m_str, outInfo);
    if (outInfo.modifyHeaders) {
      reporter->setNewHeaders(CComBSTR(outInfo.headers.c_str()).Detach());
    }
    return S_OK;
  }


private:
  // -------------------------------------------------------------------------
  // Methods
  HRESULT InitAddons();
  void DestroyAddons();
  HRESULT Init();
  HRESULT Cleanup();
  HRESULT InitializeContentScripting(BSTR bstrUrl, VARIANT_BOOL bIsRefreshingMainFrame, documentLoadPhase aPhase);
  HRESULT InitializeExtensionScripting(BSTR bstrUrl);

  struct BeforeRequestInfo
  {
    bool cancel;
    bool redirect;
    std::wstring newUrl;
  };

  HRESULT fireOnBeforeRequest(const std::wstring &aUrl, const std::wstring &aMethod, /*out*/ BeforeRequestInfo &aOutInfo)
  {
    CComPtr<ComSimpleJSObject> info;
    IF_FAILED_RET(SimpleJSObject::createInstance(info));
    info->setProperty(L"url", CComVariant(aUrl.c_str()));
    info->setProperty(L"method", CComVariant(aMethod.c_str()));
    info->setProperty(L"tabId", CComVariant(m_TabID));

    CComPtr<ComSimpleJSArray> argArray;
    IF_FAILED_RET(SimpleJSArray::createInstance(argArray));
    argArray->push_back(CComVariant(info.p));

    CComVariant result;
    m_pAnchoService->invokeEventObjectInAllExtensions(CComBSTR(L"webRequest.onBeforeRequest"), argArray.p, &result);
    if (result.vt & VT_ARRAY) {
      CComSafeArray<VARIANT> arr;
      arr.Attach(result.parray);
      //contained data already managed by CComSafeArray
      VARIANT tmp = {0}; HRESULT hr = result.Detach(&tmp);
      BEGIN_TRY_BLOCK
        for (size_t i = 0; i < arr.GetCount(); ++i) {
          JSValue item(arr.GetAt(i));

          JSValue cancel = item[L"cancel"];
        }
      END_TRY_BLOCK_CATCH_TO_HRESULT

    }
    return S_OK;
  }

  struct BeforeSendHeadersInfo
  {
    bool modifyHeaders;
    std::wstring headers;
  };

  HRESULT fireOnBeforeSendHeaders(const std::wstring &aUrl, const std::wstring &aMethod, /*out*/ BeforeSendHeadersInfo &aOutInfo)
  {
    aOutInfo.modifyHeaders = false;
    CComPtr<ComSimpleJSObject> info;
    IF_FAILED_RET(SimpleJSObject::createInstance(info));
    info->setProperty(L"url", CComVariant(aUrl.c_str()));
    info->setProperty(L"method", CComVariant(aMethod.c_str()));
    info->setProperty(L"tabId", CComVariant(m_TabID));
    info->setProperty(L"requestHeaders", CComVariant());

    CComPtr<ComSimpleJSArray> argArray;
    IF_FAILED_RET(SimpleJSArray::createInstance(argArray));
    argArray->push_back(CComVariant(info.p));

    CComVariant result;
    m_pAnchoService->invokeEventObjectInAllExtensions(CComBSTR(L"webRequest.onBeforeSendHeaders"), argArray.p, &result);
    if (result.vt & VT_ARRAY) {
      CComSafeArray<VARIANT> arr;
      arr.Attach(result.parray);
      //contained data already managed by CComSafeArray
      VARIANT tmp = {0}; HRESULT hr = result.Detach(&tmp);
      BEGIN_TRY_BLOCK
        std::wostringstream oss;
        for (size_t i = 0; i < arr.GetCount(); ++i) {
          JSValue item(arr.GetAt(i));
          JSValue requestHeaders = item[L"requestHeaders"];
          if (!requestHeaders.isNull()) {
            int headerCount = requestHeaders[L"length"].toInt();
            for (int i = 0; i < headerCount; ++i) {
              JSValue headerRecord = requestHeaders[i];
              //TODO handle headerRecord[L"binaryValue"]
              std::wstring headerText = headerRecord[L"name"].toString() + std::wstring(L": ") + headerRecord[L"value"].toString();
              oss << headerText << L"\r\n";
            }
            break;//Only one listener can change headers
          }
        }
        aOutInfo.modifyHeaders = true;
        aOutInfo.headers = oss.str();
      END_TRY_BLOCK_CATCH_TO_HRESULT

    }

    return S_OK;
  }


  HWND getTabWindow();
  HWND getFrameTabWindow()
    {return findParentWindowByClass(L"Frame Tab");}
  HWND getMainWindow()
    {return findParentWindowByClass(L"IEFrame");}

  HWND findParentWindowByClass(std::wstring aClassName);
  bool isTabActive();
private:
  // -------------------------------------------------------------------------
  // Private members.
  typedef std::map<std::wstring, CComPtr<IAnchoAddon> > AddonMap;
  CComQIPtr<IWebBrowser2>                 m_pWebBrowser;
  CComPtr<IAnchoAddonService>             m_pAnchoService;
  AddonMap                                m_Addons;
  int                                     m_TabID;
  CComPtr<DAnchoBrowserEvents>            m_pBrowserEventSource;
  DWORD                                   m_WebBrowserEventsCookie;
  DWORD                                   m_AnchoBrowserEventsCookie;
  FrameMap                                m_Frames;

  bool                                    m_ExtensionPageAPIPrepared;
  bool                                    m_IsExtensionPage;
};

OBJECT_ENTRY_AUTO(__uuidof(AnchoRuntime), CAnchoRuntime)
