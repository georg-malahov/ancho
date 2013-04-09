#include "stdafx.h"
#include "PopupWindow.h"
#include "AnchoBgSrv_i.h"
#include "AnchoAddonService.h"
#include "AnchoShared_i.h"
#include "AnchoShared/AnchoShared.h"

//class CPopupResizeEventHandler;
//typedef CComObject<CPopupResizeEventHandler> CPopupResizeEventHandlerComObject;

template<typename TFunctor>
class ATL_NO_VTABLE EventHandler :
    public CComObjectRootEx<CComSingleThreadModel>,
    public IDispatchImpl<IWebBrowserEventHandler, &IID_IWebBrowserEventHandler, &LIBID_AnchoBgSrvLib,
                /*wMajor =*/ 0xffff, /*wMinor =*/ 0xffff>
{
public:
  typedef EventHandler<TFunctor> ThisClass;
  // -------------------------------------------------------------------------
  // COM standard stuff
  DECLARE_NO_REGISTRY();
  DECLARE_NOT_AGGREGATABLE(ThisClass)
  DECLARE_PROTECT_FINAL_CONSTRUCT()

public:
  // -------------------------------------------------------------------------
  // COM interface map
  BEGIN_COM_MAP(ThisClass)
    COM_INTERFACE_ENTRY(IWebBrowserEventHandler)
    COM_INTERFACE_ENTRY(IDispatch)
  END_COM_MAP()

public:
  EventHandler(){}
  // -------------------------------------------------------------------------
  // static creator function
  static HRESULT createObject(TFunctor aListener, CComObject<EventHandler<TFunctor> > *& pRet)
  {
    CComObject<EventHandler<TFunctor> > *newObject = pRet = NULL;
    IF_FAILED_RET(CComObject<EventHandler<TFunctor> >::CreateInstance(&newObject));
    newObject->AddRef();
    newObject->mListener = aListener;
    pRet = newObject;
    return S_OK;
  }

public:
  // -------------------------------------------------------------------------
  // COM standard methods
  HRESULT FinalConstruct(){return S_OK;}
  void FinalRelease(){}


  STDMETHOD(onFire)()
  {
    IF_THROW_RET(mListener());
    //mWin->checkResize();
    return S_OK;
  }

private:
  TFunctor mListener;
};

//TODO - Replace by boost::bind()
struct OnResizeFunctor
{
  OnResizeFunctor(CPopupWindow *aWin = NULL) : mWin(aWin)
  { /*empty*/ }

  void operator()()
  {
    ATLASSERT(mWin);
    mWin->checkResize();
  }
  CPopupWindow *mWin;
};
typedef EventHandler<OnResizeFunctor> PopupResizeEventHandler;
typedef CComObject<PopupResizeEventHandler> PopupResizeEventHandlerComObject;

struct OnClickFunctor
{
  //OnClickFunctor(){}
  OnClickFunctor(CPopupWindow *aWin = NULL/*, CComPtr<IWebBrowser2> aWebBrowser*/) : mWin(aWin)//, mWebBrowser(aWebBrowser)
  { /*empty*/ }

  void operator()()
  {
    ATLASSERT(mWin);
    ATLASSERT(mWin->mWebBrowser);
    //ATLASSERT(mWebBrowser);

    CComPtr<IDispatch> doc;
    HRESULT hr = mWin->mWebBrowser->get_Document(&doc);
    CComQIPtr<IHTMLDocument2> htmlDocument2 = doc;
    if (FAILED(hr) || !htmlDocument2) {
      return;
    }

    CComQIPtr<IHTMLWindow2> htmlWindow2;
    hr = htmlDocument2->get_parentWindow(&htmlWindow2);
    if (FAILED(hr) || !htmlWindow2) {
      return;
    }

    CComQIPtr<IHTMLEventObj> htmlEvent;
    hr = htmlWindow2->get_event(&htmlEvent);
    if (FAILED(hr) || !htmlEvent) {
      return;
    }

    CComQIPtr<IHTMLElement> htmlElement;
    hr = htmlEvent->get_srcElement(&htmlElement);
    if (FAILED(hr) || !htmlElement) {
      return;
    }

    CComBSTR hrefAttr(L"href");
    CComVariant attrValue;
    hr = htmlElement->getAttribute(hrefAttr, 0, &attrValue);
    if (FAILED(hr)) {
      return;
    }
    CComBSTR tagName;
    hr = htmlElement->get_tagName(&tagName);
    if (FAILED(hr)) {
      return;
    }

    if ((tagName == L"A" || tagName == L"a") && attrValue.vt == VT_BSTR && attrValue.bstrVal) {
      htmlEvent->put_returnValue(CComVariant(false));

      //TODO - find better way to pass parameters after refactoring
      CComPtr<ComSimpleJSObject> properties;
      SimpleJSObject::createInstance(properties);
      properties->setProperty(L"url", CComVariant(attrValue));
      mWin->mService->createTabImpl(CIDispatchHelper(properties), CAnchoAddonService::ATabCreatedCallback::Ptr(), false);
    }
  }
  CPopupWindow *mWin;
  //CComPtr<IWebBrowser2> mWebBrowser;
};
typedef EventHandler<OnClickFunctor> PopupOnClickEventHandler;
typedef CComObject<PopupOnClickEventHandler> PopupOnClickEventHandlerComObject;

// -------------------------------------------------------------------------
// -------------------------------------------------------------------------
// -------------------------------------------------------------------------



HRESULT CPopupWindow::FinalConstruct()
{
  mWebBrowserEventsCookie = 0;
  CComPtr<PopupResizeEventHandlerComObject> onResizeEventHandler;
  PopupResizeEventHandler::createObject(OnResizeFunctor(this), onResizeEventHandler.p);
  mResizeEventHandler = onResizeEventHandler;


  CComPtr<PopupOnClickEventHandlerComObject> onClickEventHandler;
  PopupOnClickEventHandler::createObject(OnClickFunctor(this), onClickEventHandler.p);
  mOnClickEventHandler = onClickEventHandler;
  return S_OK;
}

void CPopupWindow::FinalRelease()
{
  int asd = 0;
}

void CPopupWindow::OnFinalMessage(HWND)
{
  // This Release call is paired with the AddRef call in OnCreate.
  Release();
}

LRESULT CPopupWindow::OnCreate(UINT /*uMsg*/, WPARAM /*wParam*/, LPARAM /*lParam*/, BOOL& /*bHandled*/)
{
  DefWindowProc();

  CComPtr<IAxWinHostWindow> spHost;
  IF_FAILED_RET2(QueryHost(__uuidof(IAxWinHostWindow), (void**)&spHost), -1);

  CComPtr<IUnknown>  p;
  IF_FAILED_RET2(spHost->CreateControlEx(mURL, *this, NULL, &p, /*DIID_DWebBrowserEvents2, GetEventUnk()*/ IID_NULL, NULL), -1);

  mWebBrowser = p;
  if (!mWebBrowser)
  {
    return -1;
  }

  AtlAdvise(mWebBrowser, (IUnknown *)(PopupWebBrowserEvents *) this, DIID_DWebBrowserEvents2, &mWebBrowserEventsCookie);


  CIDispatchHelper script = CIDispatchHelper::GetScriptDispatch(mWebBrowser);
  for (DispatchMap::iterator it = mInjectedObjects.begin(); it != mInjectedObjects.end(); ++it) {
    ATLTRACE(L"INJECTING OBJECT %s\n", it->first.c_str());
    script.SetProperty((LPOLESTR)(it->first.c_str()), CComVariant(it->second));
  }

  //Replacing XMLHttpRequest by wrapper
  CComPtr<IAnchoXmlHttpRequest> pRequest;
  IF_FAILED_RET(createAnchoXHRInstance(&pRequest));

  CIDispatchHelper window;
  script.Get<CIDispatchHelper, VT_DISPATCH, IDispatch*>(L"window", window);
  if (window) {
    IF_FAILED_RET(window.SetProperty((LPOLESTR)L"XMLHttpRequest", CComVariant(pRequest.p)));
  }

  // This AddRef call is paired with the Release call in OnFinalMessage
  // to keep the object alive as long as the window exists.
  AddRef();
  return 0;
}

LRESULT CPopupWindow::OnDestroy(UINT /*uMsg*/, WPARAM /*wParam*/, LPARAM /*lParam*/, BOOL& bHandled)
{
  AtlUnadvise(mWebBrowser, DIID_DWebBrowserEvents2, mWebBrowserEventsCookie);
  bHandled = FALSE;
  //Cleanup procedure
  mCloseCallback.Invoke0(DISPID(0));
  mWebBrowser.Release();
  return 1;
}

LRESULT CPopupWindow::OnActivate(UINT /*uMsg*/, WPARAM wParam, LPARAM /*lParam*/, BOOL& /*bHandled*/)
{
  if (wParam == WA_INACTIVE) {
    DestroyWindow();
    return 0;
  }
  return 1;
}

STDMETHODIMP_(void) CPopupWindow::OnBrowserProgressChange(LONG Progress, LONG ProgressMax)
{
  //Workaround to rid of the ActiveXObject
  //?? still some scripts are started earlier ??
  //also executed multiple times
  CIDispatchHelper script = CIDispatchHelper::GetScriptDispatch(mWebBrowser);
  CIDispatchHelper window;
  script.Get<CIDispatchHelper, VT_DISPATCH, IDispatch*>(L"window", window);
  window.SetProperty((LPOLESTR)L"ActiveXObject", CComVariant());

  //Autoresize
  checkResize();

  CComQIPtr<IHTMLElement2> bodyElement = getBodyElement();

  if (bodyElement) {
    bodyElement->put_onresize(mResizeEventHandler);
  }

  CComPtr<IDispatch> doc;
  if (FAILED(mWebBrowser->get_Document(&doc)) || !doc) {
    return;
  }
  CComQIPtr<IHTMLDocument2> htmlDocument2 = doc;
  if (!htmlDocument2) {
    return;
  }
  htmlDocument2->put_onclick(mOnClickEventHandler);

}

void CPopupWindow::checkResize()
{
  CComQIPtr<IHTMLElement2> bodyElement = getBodyElement();
  if (!bodyElement) {
    return;
  }

  long contentHeight, contentWidth;
  if (FAILED(bodyElement->get_scrollHeight(&contentHeight)) ||
    FAILED(bodyElement->get_scrollWidth(&contentWidth)))
  {
    return;
  }
  if (contentHeight > 0 && contentWidth > 0) {
    CRect rect;
    BOOL res = GetWindowRect(rect);

    if (res && (rect.Height() != contentHeight || rect.Width() != contentWidth)) {
      MoveWindow(rect.left, rect.top, contentWidth, contentHeight, TRUE);
    }
  }
}

CComPtr<IHTMLElement> CPopupWindow::getBodyElement()
{
  CComPtr<IDispatch> doc;
  if (FAILED(mWebBrowser->get_Document(&doc)) || !doc) {
    return CComPtr<IHTMLElement>();
  }
  CComQIPtr<IHTMLDocument2> htmlDocument2 = doc;
  if (!htmlDocument2) {
    return CComPtr<IHTMLElement>();
  }
  CComPtr<IHTMLElement> element;
  if (FAILED(htmlDocument2->get_body(&element)) || !element ) {
    return CComPtr<IHTMLElement>();
  }
  return element;
}


HRESULT CPopupWindow::CreatePopupWindow(HWND aParent, CAnchoAddonService *aService, const DispatchMap &aInjectedObjects, LPCWSTR aURL, int aX, int aY, CIDispatchHelper aCloseCallback)
{
  ATLASSERT(aService);
  CPopupWindowComObject * pNewWindow = NULL;
  IF_FAILED_RET(CPopupWindowComObject::CreateInstance(&pNewWindow));
  pNewWindow->mURL = aURL;
  pNewWindow->mInjectedObjects = aInjectedObjects;
  pNewWindow->mCloseCallback = aCloseCallback;
  pNewWindow->mService = aService;
  RECT r = {aX, aY, aX + defaultWidth, aY + defaultHeight};

  if (!pNewWindow->Create(aParent, r, NULL, WS_POPUP))
  {
    return E_FAIL;
  }
  pNewWindow->ShowWindow(SW_SHOW);
  return S_OK;
}