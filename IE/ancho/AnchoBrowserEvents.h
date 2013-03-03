/****************************************************************************
 * AnchoBrowserEvents.h : Declaration of the CAnchoBrowserEvents
 * Copyright 2012 Salsita software (http://www.salsitasoft.com).
 * Author: Matthew Gertner <matthew@salsitasoft.com>
 ****************************************************************************/

#pragma once
#include "ancho_i.h"


#if defined(_WIN32_WCE) && !defined(_CE_DCOM) && !defined(_CE_ALLOW_SINGLE_THREADED_OBJECTS_IN_MTA)
#error "Single-threaded COM objects are not properly supported on Windows CE platform, such as the Windows Mobile platforms that do not include full DCOM support. Define _CE_ALLOW_SINGLE_THREADED_OBJECTS_IN_MTA to force ATL to support creating single-thread COM object's and allow use of it's single-threaded COM object implementations. The threading model in your rgs file was set to 'Free' as that is the only threading model supported in non DCOM Windows CE platforms."
#endif

class WebRequestReporter;
typedef CComObject<WebRequestReporter> WebRequestReporterComObject;

 /*============================================================================
 * class CAnchoBrowserEvents
 */
class ATL_NO_VTABLE CAnchoBrowserEvents :
  public CComObjectRootEx<CComSingleThreadModel>,
  public IDispatchImpl<DAnchoBrowserEvents, &IID_DAnchoBrowserEvents, &LIBID_anchoLib, 0xffff, 0xffff>,
  public IConnectionPointContainerImpl<CAnchoBrowserEvents>,
  public IConnectionPointImpl<CAnchoBrowserEvents, &IID_DAnchoBrowserEvents, CComDynamicUnkArray>
{
public:
  // -------------------------------------------------------------------------
  // ctor
  CAnchoBrowserEvents()
  {
  }

  // -------------------------------------------------------------------------
  // COM standard stuff
  DECLARE_NO_REGISTRY()
  DECLARE_NOT_AGGREGATABLE(CAnchoBrowserEvents)
  DECLARE_PROTECT_FINAL_CONSTRUCT()

  // -------------------------------------------------------------------------
  // COM interface map
  BEGIN_COM_MAP(CAnchoBrowserEvents)
    COM_INTERFACE_ENTRY(IDispatch)
    COM_INTERFACE_ENTRY(DAnchoBrowserEvents)
    COM_INTERFACE_ENTRY(IConnectionPointContainer)
    COM_INTERFACE_ENTRY_IMPL(IConnectionPointContainer)
  END_COM_MAP()

  // -------------------------------------------------------------------------
  // COM connection point map
  BEGIN_CONNECTION_POINT_MAP(CAnchoBrowserEvents)
    CONNECTION_POINT_ENTRY(IID_DAnchoBrowserEvents)
  END_CONNECTION_POINT_MAP()

public:
  enum EventId {
    EID_ONFRAMESTART = 1,
    EID_ONFRAMEEND = 2,
    EID_ONFRAMEREDIRECT = 3,
    EID_ONBEFOREREQUEST = 4,
    EID_ONBEFORESENDHEADERS = 5
  };

  // -------------------------------------------------------------------------
  // CAnchoBrowserEvents methods
  STDMETHOD(OnFrameStart)(BSTR bstrUrl, VARIANT_BOOL bIsMainFrame);
  STDMETHOD(OnFrameEnd)(BSTR bstrUrl, VARIANT_BOOL bIsMainFrame);
  STDMETHOD(OnFrameRedirect)(BSTR bstrOldUrl, BSTR bstrNewUrl);

  STDMETHOD(OnBeforeRequest)(VARIANT aReporter);
  STDMETHOD(OnBeforeSendHeaders)(VARIANT aReporter);
private:
  // -------------------------------------------------------------------------
  // Methods
  HRESULT FireEvent(DISPID dispid, DISPPARAMS* disp, unsigned int count);

private:
  // -------------------------------------------------------------------------
  // Private members.
};

// -------------------------------------------------------------------------
class ATL_NO_VTABLE WebRequestReporter :
  public CComObjectRootEx<CComSingleThreadModel>,
  public IWebRequestReporter
{
public:
  // -------------------------------------------------------------------------
  // ctor
  WebRequestReporter(): mCancel(false), mRedirect(false), mNewHeadersAdded(false)
  {
  }

  // -------------------------------------------------------------------------
  // COM standard stuff
  DECLARE_NO_REGISTRY()
  DECLARE_NOT_AGGREGATABLE(WebRequestReporter)
  DECLARE_PROTECT_FINAL_CONSTRUCT()

  // -------------------------------------------------------------------------
  // COM interface map
  BEGIN_COM_MAP(WebRequestReporter)
    COM_INTERFACE_ENTRY(IWebRequestReporter)
  END_COM_MAP()

  // -------------------------------------------------------------------------
  // COM standard methods
  HRESULT FinalConstruct()
  {
    return S_OK;
  }

  void FinalRelease()
  {
  }

  STDMETHOD(init)(BSTR aUrl, BSTR aMethod)
  {
    mUrl = aUrl;
    mHTTPMethod = aMethod;
    return S_OK;
  }

  STDMETHOD(setNewHeaders)(BSTR aNewHeaders)
  {
    mNewHeaders = aNewHeaders;
    mNewHeadersAdded = true;
    return S_OK;
  }

  STDMETHOD(getNewHeaders)(BSTR *aNewHeaders)
  {
    ENSURE_RETVAL(aNewHeaders);
    *aNewHeaders = mNewHeaders.Copy();
    return S_OK;
  }

  STDMETHOD(getHTTPMethod)(BSTR *aMethod)
  {
    ENSURE_RETVAL(aMethod);
    *aMethod = mHTTPMethod.Copy();
    return S_OK;
  }

  STDMETHOD(getUrl)(BSTR *aUrl)
  {
    ENSURE_RETVAL(aUrl);
    *aUrl = mUrl.Copy();
    return S_OK;
  }

  STDMETHOD(redirectRequest)(BSTR aUrl)
  {
    mNewUrl = aUrl;
    mRedirect = true;
    return S_OK;
  }

  STDMETHOD(cancelRequest)()
  {
    mCancel = true;
    return S_OK;
  }

  STDMETHOD(shouldCancel)(BOOL *aCancel)
  {
    ENSURE_RETVAL(aCancel);
    *aCancel = mCancel ? TRUE : FALSE;
    return S_OK;
  }

public:
  bool mCancel;
  bool mRedirect;
  bool mNewHeadersAdded;
  CComBSTR mNewUrl;
  CComBSTR mUrl;
  CComBSTR mHTTPMethod;
  CComBSTR mNewHeaders;
};
