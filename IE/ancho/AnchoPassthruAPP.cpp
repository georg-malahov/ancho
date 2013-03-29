/****************************************************************************
 * AnchoPassthruAPP.cpp : Implementation of CAnchoPassthruAPP
 * Copyright 2012 Salsita (http://www.salsitasoft.com).
 * Author: Matthew Gertner <matthew@salsitasoft.com>
 ****************************************************************************/

#include "stdafx.h"
#include "AnchoPassthruAPP.h"

#include "libbhohelper.h"

#include <atlbase.h>
#include <WinInet.h>
#include <htiframe.h>

enum {
  ANCHO_SWITCH_BASE = 50000,
  ANCHO_SWITCH_REPORT_DATA,
  ANCHO_SWITCH_REPORT_RESULT,
  ANCHO_SWITCH_REDIRECT,

  ANCHO_SWITCH_MAX
};

static CComBSTR
getMethodNameFromBindInfo(BINDINFO &aInfo)
{
  CComBSTR method;
  switch (aInfo.dwBindVerb) {
  case BINDVERB_GET:
    method = L"GET";
    break;
  case BINDVERB_POST:
    method = L"POST";
    break;
  case BINDVERB_PUT:
    method = L"PUT";
    break;
  default:
    method = L"";
    break;
  };
  return method;
}

/*============================================================================
 * class CAnchoStartPolicy
 */

//----------------------------------------------------------------------------
//  OnStart
HRESULT CAnchoStartPolicy::OnStart(
  LPCWSTR szUrl, IInternetProtocolSink *pOIProtSink,
  IInternetBindInfo *pOIBindInfo,  DWORD grfPI, HANDLE_PTR dwReserved,
  IInternetProtocol* pTargetProtocol)
{
  GetSink()->m_Url = szUrl;
  return __super::OnStart(szUrl, pOIProtSink, pOIBindInfo, grfPI, dwReserved, pTargetProtocol);
}

//----------------------------------------------------------------------------
//  OnStartEx
HRESULT CAnchoStartPolicy::OnStartEx(
  IUri* pUri, IInternetProtocolSink *pOIProtSink,
  IInternetBindInfo *pOIBindInfo,  DWORD grfPI, HANDLE_PTR dwReserved,
  IInternetProtocolEx* pTargetProtocol)
{
  ATLASSERT(pUri != NULL);
  CComBSTR rawUri;
  HRESULT hr = pUri->GetRawUri(&rawUri);
  GetSink()->m_Url = std::wstring(rawUri, ::SysStringLen(rawUri));
  return __super::OnStartEx(pUri, pOIProtSink, pOIBindInfo, grfPI, dwReserved, pTargetProtocol);
}

/*============================================================================
 * class CAnchoProtocolSink
 */

//----------------------------------------------------------------------------
//  BeginningTransaction
STDMETHODIMP CAnchoProtocolSink::BeginningTransaction(
  /* [in] */ LPCWSTR szURL,
  /* [in] */ LPCWSTR szHeaders,
  /* [in] */ DWORD dwReserved,
  /* [out] */ LPWSTR *pszAdditionalHeaders)
{
  // If we have a bind context then we know that this request is for a document loading into a frame.
  LPOLESTR bind_ctx_string = NULL;
  CComPtr<IBindCtx> bind_ctx;
  ULONG count;
  GetBindString(BINDSTRING_PTR_BIND_CONTEXT, &bind_ctx_string, 1, &count);
  m_IsFrame = (bind_ctx_string != NULL);
  ::CoTaskMemFree(bind_ctx_string);

  if (pszAdditionalHeaders)
  {
    *pszAdditionalHeaders = 0;
  }

  { // event firing
    CAnchoPassthruAPP *protocol = CAnchoPassthruAPP::GetProtocol(this);

    CComBSTR method;
    BINDINFO bindInfo = {0};
    bindInfo.cbSize = sizeof(BINDINFO);
    DWORD grfBINDF;
    if (SUCCEEDED(GetBindInfo(&grfBINDF, &bindInfo))) {
      method = getMethodNameFromBindInfo(bindInfo);
    } else {
      method = L"GET";
    }

    WebRequestReporterComObject * pNewObject = NULL;
    if (SUCCEEDED(WebRequestReporterComObject::CreateInstance(&pNewObject))) {
      CComPtr<IWebRequestReporter> reporter(pNewObject);
      if (reporter && SUCCEEDED(reporter->init(CComBSTR(szURL), method))) {
        if (SUCCEEDED(protocol->fireOnBeforeHeaders(CComPtr<CAnchoProtocolSink>(this), CComBSTR(szURL), reporter))) {
          if (pNewObject->mNewHeadersAdded) {
            LPWSTR wszAdditionalHeaders = (LPWSTR) CoTaskMemAlloc((pNewObject->mNewHeaders.Length()+1)*sizeof(WCHAR));
            if (!wszAdditionalHeaders) {
              return E_OUTOFMEMORY;
            }
            wcscpy_s(wszAdditionalHeaders, pNewObject->mNewHeaders.Length()+1, pNewObject->mNewHeaders.m_str);
            wszAdditionalHeaders[pNewObject->mNewHeaders.Length()] = 0;
            *pszAdditionalHeaders = wszAdditionalHeaders;
          }
        }
      }
    }
  }
  CComPtr<IHttpNegotiate> spHttpNegotiate;
  IF_FAILED_RET(QueryServiceFromClient(&spHttpNegotiate));

  HRESULT hr = spHttpNegotiate ?
    spHttpNegotiate->BeginningTransaction(szURL, szHeaders,
      dwReserved, pszAdditionalHeaders) :
    S_OK;
  IF_FAILED_RET(hr);

  return S_OK;
}

//----------------------------------------------------------------------------
//  OnResponse
STDMETHODIMP CAnchoProtocolSink::OnResponse(
  /* [in] */ DWORD dwResponseCode,
  /* [in] */ LPCWSTR szResponseHeaders,
  /* [in] */ LPCWSTR szRequestHeaders,
  /* [out] */ LPWSTR *pszAdditionalRequestHeaders)
{
  HRESULT hr;
  CComPtr<IHttpNegotiate> spHttpNegotiate;
  QueryServiceFromClient(&spHttpNegotiate);

  if (pszAdditionalRequestHeaders)
  {
    *pszAdditionalRequestHeaders = 0;
  }

  hr = spHttpNegotiate ?
    spHttpNegotiate->OnResponse(dwResponseCode, szResponseHeaders,
      szRequestHeaders, pszAdditionalRequestHeaders) :
    S_OK;

  return hr;
}

//----------------------------------------------------------------------------
//  ReportProgress
STDMETHODIMP CAnchoProtocolSink::ReportProgress(
  /* [in] */ ULONG ulStatusCode,
  /* [in] */ LPCWSTR szStatusText)
{
  if (ulStatusCode == BINDSTATUS_REDIRECTING) {
    PROTOCOLDATA data;
    data.grfFlags = PD_FORCE_SWITCH;
    data.dwState = ANCHO_SWITCH_REDIRECT;
    data.pData = InitSwitchParams((BSTR) m_Url.c_str(), (BSTR) szStatusText);
    data.cbData = sizeof(BSTR*);
    AddRef();
    Switch(&data);

    m_Url = szStatusText;
  }

  ATLASSERT(m_spInternetProtocolSink != 0);
  HRESULT hr = m_spInternetProtocolSink ?
    m_spInternetProtocolSink->ReportProgress(ulStatusCode, szStatusText) :
    S_OK;

  return hr;
}

//----------------------------------------------------------------------------
//  ReportData
STDMETHODIMP CAnchoProtocolSink::ReportData(
	/* [in] */ DWORD grfBSCF,
	/* [in] */ ULONG ulProgress,
	/* [in] */ ULONG ulProgressMax)
{
  PROTOCOLDATA data;
  data.grfFlags = PD_FORCE_SWITCH;
  data.dwState = ANCHO_SWITCH_REPORT_DATA;
  data.pData = InitSwitchParams((BSTR) m_Url.c_str());
  data.cbData = sizeof(BSTR*);
  AddRef();
  Switch(&data);

  return m_spInternetProtocolSink->ReportData(grfBSCF, ulProgress, ulProgressMax);
}

//----------------------------------------------------------------------------
//  ReportResult
STDMETHODIMP CAnchoProtocolSink::ReportResult(
	/* [in] */ HRESULT hrResult,
	/* [in] */ DWORD dwError,
	/* [in] */ LPCWSTR szResult)
{
  if (hrResult == 0) {
    PROTOCOLDATA data;
    data.grfFlags = PD_FORCE_SWITCH;
    data.dwState = ANCHO_SWITCH_REPORT_RESULT;
    data.pData = InitSwitchParams((BSTR) m_Url.c_str());
    data.cbData = sizeof(BSTR*);
    AddRef();
    Switch(&data);
  }

  return m_spInternetProtocolSink->ReportResult(hrResult, dwError, szResult);
}

//----------------------------------------------------------------------------
//  InitSwitchParams
LPVOID CAnchoProtocolSink::InitSwitchParams(const BSTR param1, const BSTR param2)
{
  BSTR* params = new BSTR[2];
  params[0] = ::SysAllocString(param1);
  params[1] = ::SysAllocString(param2);
  return (LPVOID) params;
}

//----------------------------------------------------------------------------
//  FreeSwitchParams
void CAnchoProtocolSink::FreeSwitchParams(BSTR* params)
{
  ::SysFreeString(params[0]);
  ::SysFreeString(params[1]);
  delete [] params;
}

/*============================================================================
 * class CAnchoPassthruAPP::DocumentSink
 */

//----------------------------------------------------------------------------
//  Destructor
CAnchoPassthruAPP::DocumentSink::~DocumentSink()
{
  if (m_Doc) {
    DispEventUnadvise(m_Doc);
  }
}

//----------------------------------------------------------------------------
//  CAnchoPassthruAPP::OnReadyStateChange
STDMETHODIMP_(void) CAnchoPassthruAPP::DocumentSink::OnReadyStateChange(IHTMLEventObj* ev)
{
  ATLASSERT(m_Doc != NULL);
  CComBSTR readyState;
  m_Doc->get_readyState(&readyState);

  if (readyState == L"complete") {
    CComBSTR loc;
    DispEventUnadvise(m_Doc);
    m_Doc = NULL;
    m_Events->OnFrameEnd(m_Url, m_IsRefreshingMainFrame ? VARIANT_TRUE : VARIANT_FALSE);

    // Release the pointer to the APP so we can be freed.
    m_APP = NULL;
  }
}

/*============================================================================
 * class CAnchoPassthruAPP
 */

//----------------------------------------------------------------------------
//  Destructor
CAnchoPassthruAPP::~CAnchoPassthruAPP()
{
  if (m_DocSink) {
    delete m_DocSink;
  }
}

STDMETHODIMP CAnchoPassthruAPP::fireOnBeforeHeaders(CComPtr<CAnchoProtocolSink> aSink, const CComBSTR &aUrl, CComPtr<IWebRequestReporter> aReporter)
{
  if (!m_BrowserEvents) {
    if (!m_Doc) {
      HRESULT hr = getDocumentFromSink(aSink, m_Doc);
      if (S_OK != hr) {
        return hr;
      }
    }
    IF_FAILED_RET(getEventsFromSink(aSink, aUrl, m_BrowserEvents));
  }
  if (m_BrowserEvents) {
    m_BrowserEvents->OnBeforeSendHeaders(CComVariant(aReporter.p));
  }
  return S_OK;
}

STDMETHODIMP CAnchoPassthruAPP::getDocumentFromSink(CComPtr<CAnchoProtocolSink> aSink, CComPtr<IHTMLDocument2> &aDoc)
{
  if (!m_Doc) {
    CComPtr<IWindowForBindingUI> windowForBindingUI;
    HRESULT hr = S_OK;

    aSink->QueryServiceFromClient(IID_IWindowForBindingUI, &windowForBindingUI);
    if (!windowForBindingUI) {
      return E_FAIL;
    }
    HWND hwnd;
    if (FAILED(windowForBindingUI->GetWindow(IID_IAuthenticate, &hwnd))) {
      HRESULT hr = windowForBindingUI->GetWindow(IID_IHttpSecurity, &hwnd);
      if (FAILED(hr)) {
        ATLTRACE(L"CAnchoPassthruAPP - failed to obtain window handle");
        return hr;
      }
    }

    hr = getHTMLDocumentForHWND(hwnd, &aDoc);
    if (FAILED(hr)) {
      return S_FALSE;
    }
  }
  return S_OK;
}

STDMETHODIMP CAnchoPassthruAPP::getEventsFromSink(CComPtr<CAnchoProtocolSink> aSink, const CComBSTR &aUrl, CComPtr<DAnchoBrowserEvents> &aEvents)
{
  ATLASSERT(m_Doc);

  CComPtr<IWebBrowser2> browser;
  IF_FAILED_RET(getBrowserForHTMLDocument(m_Doc, &browser));

  CComVariant var;
  IF_FAILED_RET(browser->GetProperty(L"_anchoBrowserEvents", &var));

  CComQIPtr<DAnchoBrowserEvents> events = var.pdispVal;
  aEvents = events;
  if (!aEvents) {
    return E_FAIL;
  }
  return S_OK;
}

//----------------------------------------------------------------------------
//  StartEx
STDMETHODIMP CAnchoPassthruAPP::StartEx(
		IUri *pUri,
		IInternetProtocolSink *pOIProtSink,
		IInternetBindInfo *pOIBindInfo,
		DWORD grfPI,
		HANDLE_PTR dwReserved)
{
  CComBSTR rawUri;
  IF_FAILED_RET(pUri->GetRawUri(&rawUri));
  CComPtr<CAnchoProtocolSink> pSink = GetSink();

  CComBSTR method;
  BINDINFO bindInfo = {0};
  bindInfo.cbSize = sizeof(BINDINFO);
  DWORD grfBINDF = 0;
  //When I move GetBindInfo() after __super::StartEx it crashes
  if (SUCCEEDED(pOIBindInfo->GetBindInfo(&grfBINDF, &bindInfo))) {
    method = getMethodNameFromBindInfo(bindInfo);
  } else {
    method = L"GET";
  }

  IF_FAILED_RET(__super::StartEx(pUri, pOIProtSink, pOIBindInfo, grfPI, dwReserved));

  if (!m_BrowserEvents) {
    if (!m_Doc) {
      HRESULT hr = getDocumentFromSink(pSink, m_Doc);
      if (S_OK != hr) {
        //We need to return success - otherwise the request would be thrown away
        return S_OK;//hr;
      }
    }
    IF_FAILED_RET(getEventsFromSink(pSink, rawUri, m_BrowserEvents));
  }
  if (m_BrowserEvents) {
    WebRequestReporterComObject * pNewObject = NULL;
    if (SUCCEEDED(WebRequestReporterComObject::CreateInstance(&pNewObject))) {
      CComPtr<IWebRequestReporter> reporter(pNewObject);
      if (reporter) {
        IF_FAILED_RET(reporter->init(rawUri, method));
        IF_FAILED_RET(m_BrowserEvents->OnBeforeRequest(CComVariant(reporter.p)));
        BOOL cancel = FALSE;
        if (SUCCEEDED(reporter->shouldCancel(&cancel)) && cancel) {
          Abort(INET_E_TERMINATED_BIND, 0);
        }
      }
    }
  }

  return S_OK;
}

//----------------------------------------------------------------------------
//  Continue
STDMETHODIMP CAnchoPassthruAPP::Continue(PROTOCOLDATA* data)
{
  if (data->dwState >= ANCHO_SWITCH_BASE && data->dwState < ANCHO_SWITCH_MAX) {
    if (data->dwState == ANCHO_SWITCH_REPORT_DATA && m_ProcessedReportData) {
      // We already handled this;
      return S_OK;
    }

    CComPtr<CAnchoProtocolSink> pSink = GetSink();
    // Release the reference we added when calling Switch().
    pSink->InternalRelease();

    BSTR* params = (BSTR*) data->pData;
    ATLASSERT(data->cbData);
    ATLASSERT(params);
    CComBSTR bstrUrl = params[0];
    CComBSTR bstrAdditional = params[1];
    pSink->FreeSwitchParams(params);

    if (!m_BrowserEvents) {
      if (!m_Doc) {
        HRESULT hr = getDocumentFromSink(pSink, m_Doc);
        if (FAILED(hr)) {
          return hr;
        };
        if (S_FALSE == hr) {
          // Not ready to get the window yet so we'll try again with the next notification.
          if (data->dwState == ANCHO_SWITCH_REDIRECT) {
            // Remember the redirect so we can trigger the corresponding event later.
            m_Redirects.push_back(std::make_pair(bstrUrl, bstrAdditional));
          }
          return S_FALSE;
        }
      }
      IF_FAILED_RET(getEventsFromSink(pSink, bstrUrl, m_BrowserEvents));

      if (!m_BrowserEvents) {
        return S_OK;;
      }
    }

    {
      CComPtr<IWebBrowser2> browser;
      IF_FAILED_RET(getBrowserForHTMLDocument(m_Doc, &browser));

      CComVariant tmp;
      browser->GetProperty(CComBSTR(L"NavigateURL"), &tmp);
      std::wstring navigateUrl = tmp.bstrVal;

      CComBSTR topLevelUrl; // = var.bstrVal;
      IF_FAILED_RET(browser->get_LocationURL(&topLevelUrl));
      // If we're refreshing then the sink won't know it is a frame, and the URL
      // will match the one already loaded into the browser.
      std::wstring strippedTopLevelUrl = stripFragmentFromUrl(std::wstring(topLevelUrl.m_str));
      m_IsRefreshingMainFrame = !(pSink->IsFrame())
              && (strippedTopLevelUrl == std::wstring(bstrUrl.m_str) || stripFragmentFromUrl(navigateUrl) == std::wstring(bstrUrl.m_str));

      // We only want to handle the top-level request and any frames, not subordinate
      // requests like images. Usually the desired requests will have a bind context,
      // but in the case of a page refresh, the top-level request annoyingly doesn't,
      // so we check if the URL of the request matches the URL of the browser to handle
      // that case.
      if (!(pSink->IsFrame()) && !m_IsRefreshingMainFrame) {
        return S_OK;
      }
    }

    ATLASSERT(m_Doc != NULL);

    // Send the event for any redirects that occurred before we had access to the event sink.
    RedirectList::iterator it = m_Redirects.begin();
    while(it != m_Redirects.end()) {
      IF_FAILED_RET(m_BrowserEvents->OnFrameRedirect(CComBSTR(it->first.c_str()),
        CComBSTR(it->second.c_str())));
      ++it;
    }
    m_Redirects.clear();

    if (data->dwState == ANCHO_SWITCH_REPORT_DATA) {
      m_ProcessedReportData = true;

      IF_FAILED_RET(m_BrowserEvents->OnFrameStart(bstrUrl, m_IsRefreshingMainFrame ? VARIANT_TRUE : VARIANT_FALSE));

      CComBSTR readyState;
      m_Doc->get_readyState(&readyState);
      if (wcscmp(readyState, L"complete") == 0) {
        IF_FAILED_RET(m_BrowserEvents->OnFrameEnd(bstrUrl, m_IsRefreshingMainFrame ? VARIANT_TRUE : VARIANT_FALSE));
      }
      else {
        m_DocSink = new DocumentSink(this, m_Doc, m_BrowserEvents, bstrUrl, m_IsRefreshingMainFrame);
        m_DocSink->DispEventAdvise(m_Doc);
      }
    }
    else if (data->dwState == ANCHO_SWITCH_REDIRECT) {
      IF_FAILED_RET(m_BrowserEvents->OnFrameRedirect(bstrUrl, bstrAdditional));
    }
  }

  return __super::Continue(data);
}
