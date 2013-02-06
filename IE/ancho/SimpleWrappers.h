#pragma once

#include <map>
#include <sstream>
#include <algorithm>

class SimpleJSObject;
typedef CComObject<SimpleJSObject>  ComSimpleJSObject;
class SimpleJSArray;
typedef CComObject<SimpleJSArray>  ComSimpleJSArray;

//------------------------------------------------------------
// Simple std::map wrapper
// TODO - extend and move to more suitable place (some utility library)
class ATL_NO_VTABLE SimpleJSObject :
  public CComObjectRootEx<CComSingleThreadModel>,
  public IDispatch
{
public:

  static HRESULT createInstance(CComPtr<ComSimpleJSObject> & aRet)
  {
    ComSimpleJSObject * newObject = NULL;
    IF_FAILED_RET(ComSimpleJSObject::CreateInstance(&newObject));
    CComPtr<ComSimpleJSObject> objectRet(newObject);  // to have a refcount of 1
    aRet = objectRet;
    return S_OK;
  }

  // -------------------------------------------------------------------------
  // COM interface map
  BEGIN_COM_MAP(SimpleJSObject)
    COM_INTERFACE_ENTRY(IDispatch)
  END_COM_MAP()

  // -------------------------------------------------------------------------
  // IDispatch methods
  STDMETHOD(GetTypeInfoCount)(UINT *pctinfo)
  {
    ENSURE_RETVAL(pctinfo);
    *pctinfo = 0;
    return S_OK;
  }

  STDMETHOD(GetTypeInfo)(UINT iTInfo, LCID lcid, ITypeInfo **ppTInfo)
  {
    return E_INVALIDARG;
  }

  STDMETHOD(GetIDsOfNames)(REFIID riid, LPOLESTR *rgszNames, UINT cNames,
                                         LCID lcid, DISPID *rgDispId)
  {
    ATLASSERT(rgszNames != NULL);
    ENSURE_RETVAL(rgDispId);
    HRESULT hr = S_OK;
    for (size_t i = 0; i < cNames; ++i) {
      MapDISPID::const_iterator it = mNameToID.find(std::wstring(rgszNames[i]));
      if (it != mNameToID.end()) {
        rgDispId[i] = it->second+1;
      } else {
        hr = DISP_E_UNKNOWNNAME;
        rgDispId[i] = DISPID_UNKNOWN;
      }
    }
    return hr;
  }

  STDMETHOD(Invoke)(DISPID dispIdMember, REFIID riid, LCID lcid, WORD wFlags,
                                  DISPPARAMS *pDispParams, VARIANT *pVarResult,
                                  EXCEPINFO *pExcepInfo, UINT *puArgErr)
  {
    ENSURE_RETVAL(pVarResult);
    if (dispIdMember > (int)mProperties.size() || dispIdMember == 0) {
      VariantClear(pVarResult);
      return DISP_E_MEMBERNOTFOUND;
    }
    //Read-only access
    if (wFlags != DISPATCH_PROPERTYGET) {
      /*if (pExcepInfo) {
        pExcepInfo->bstrDescription
      }*/
      return DISP_E_EXCEPTION;
    }
    return VariantCopy(pVarResult, &(mProperties[dispIdMember-1]));
  }

  HRESULT setProperty(const std::wstring &aName, CComVariant &aValue)
  {
    MapDISPID::iterator it = mNameToID.find(aName);
    if (it != mNameToID.end()) {
      mProperties[it->second] = aValue;
    } else {
      mNameToID[aName] = mProperties.size();
      mProperties.push_back(aValue);
    }
    return S_OK;
  }

protected:
  SimpleJSObject() {}

  typedef std::map<std::wstring, DISPID> MapDISPID;

  VariantVector mProperties;
  MapDISPID mNameToID;
};

//------------------------------------------------------------
// Simple std::vector wrapper
// TODO - extend and move to more suitable place (some utility library)
class ATL_NO_VTABLE SimpleJSArray :
  public CComObjectRootEx<CComSingleThreadModel>,
  public IDispatch,
  public VariantVector
{
public:

  enum {LENGTH_DISPID = 1,
    PUSH_DISPID = 2,
    INDEX_START = 3
  };

  static HRESULT createInstance(CComPtr<ComSimpleJSArray> & aRet)
  {
    ComSimpleJSArray * newObject = NULL;
    IF_FAILED_RET(ComSimpleJSArray::CreateInstance(&newObject));
    CComPtr<ComSimpleJSArray> objectRet(newObject);  // to have a refcount of 1
    aRet = objectRet;
    return S_OK;
  }

  static HRESULT createInstance(const VariantVector &aVector, CComPtr<ComSimpleJSArray> & aRet)
  {
    ComSimpleJSArray * newObject = NULL;
    IF_FAILED_RET(ComSimpleJSArray::CreateInstance(&newObject));
    CComPtr<ComSimpleJSArray> objectRet(newObject);  // to have a refcount of 1
    std::copy(aVector.begin(), aVector.end(), newObject->begin());
    aRet = objectRet;
    return S_OK;
  }

  // -------------------------------------------------------------------------
  // COM interface map
  BEGIN_COM_MAP(SimpleJSArray)
    COM_INTERFACE_ENTRY(IDispatch)
  END_COM_MAP()

  // -------------------------------------------------------------------------
  // IDispatch methods
  STDMETHOD(GetTypeInfoCount)(UINT *pctinfo)
  {
    ENSURE_RETVAL(pctinfo);
    *pctinfo = 0;
    return S_OK;
  }

  STDMETHOD(GetTypeInfo)(UINT iTInfo, LCID lcid, ITypeInfo **ppTInfo)
  {
    return E_INVALIDARG;
  }

  STDMETHOD(GetIDsOfNames)(REFIID riid, LPOLESTR *rgszNames, UINT cNames,
                                         LCID lcid, DISPID *rgDispId)
  {
    ATLASSERT(rgszNames != NULL);
    ENSURE_RETVAL(rgDispId);
    HRESULT hr = S_OK;
    for (size_t i = 0; i < cNames; ++i) {
      if (std::wstring(L"length") == rgszNames[i]) {
        rgDispId[i] = LENGTH_DISPID;
        continue;
      }
      if (std::wstring(L"push") == rgszNames[i]) {
        rgDispId[i] = PUSH_DISPID;
        continue;
      }
      std::wstring name(rgszNames[i]);
      std::wistringstream iss (name, std::istringstream::in);
      long int idx = -1;
      iss >> idx;
      if (idx >= 0) {
        rgDispId[i] = idx + INDEX_START;
        continue;
      }
      hr = DISP_E_UNKNOWNNAME;
      rgDispId[i] = DISPID_UNKNOWN;
    }
    return hr;
  }

  STDMETHOD(Invoke)(DISPID dispIdMember, REFIID riid, LCID lcid, WORD wFlags,
                                  DISPPARAMS *pDispParams, VARIANT *pVarResult,
                                  EXCEPINFO *pExcepInfo, UINT *puArgErr)
  {
    ENSURE_RETVAL(pVarResult);
    if (dispIdMember >= ((int)this->size() + INDEX_START)
      || dispIdMember <= 0)
    {
      VariantClear(pVarResult);
      return DISP_E_MEMBERNOTFOUND;
    }
    if (dispIdMember == LENGTH_DISPID) {
      CComVariant length(static_cast<int>(this->size()));
      return length.Detach(pVarResult);
    }
    if (wFlags == DISPATCH_METHOD) {
      for (size_t i = 0; i < pDispParams->cArgs; ++i) {
        push_back(CComVariant(pDispParams->rgvarg[i]));
      }
      if (pVarResult) {
        CComVariant res = size();
        IF_FAILED_RET(res.Detach(pVarResult));
      }
      return S_OK;
    }
    //read-only
    if (wFlags != DISPATCH_PROPERTYGET) {
      /*if (pExcepInfo) { //TODO
        pExcepInfo->bstrDescription
      }*/
      return DISP_E_EXCEPTION;
    }
    return VariantCopy(pVarResult, &(this->at(dispIdMember-INDEX_START)));
  }

protected:
  SimpleJSArray() {}
};

//---------------------------------------------------------------------------------------------
#define JS_OBJECT_TO_TYPE(TYPENAME, NAME, VARTYPE, EXCEPTION)\
  TYPENAME to##NAME(){ \
    if (!is##NAME()) { \
      ANCHO_THROW(EXCEPTION()); \
    } \
    return TYPENAME((VARTYPE)(mCurrentValue.llVal));\
  }
#define JS_OBJECT_IS_TYPE(NAME, VT)\
  bool is##NAME(){ \
      HRESULT hr = mCurrentValue.ChangeType(VT);\
      if (FAILED(hr)) {\
        return false;\
      }\
      return true;\
  }

#define JS_OBJECT_TYPE_METHODS(TYPENAME, NAME, VARTYPE, VT, EXCEPTION)\
  JS_OBJECT_IS_TYPE(NAME, VT)\
  JS_OBJECT_TO_TYPE(TYPENAME, NAME, VARTYPE, EXCEPTION)

//Wrapper for JS objects - currently read-only access
class JSValue
{
public:
  friend void swap(JSValue &aVal1, JSValue &aVal2);

  JSValue() {}

  JSValue(const CComVariant &aVariant)
    : mCurrentValue(aVariant) {}

  JSValue(const VARIANT &aVariant)
    : mCurrentValue(aVariant) {}

  JSValue(const JSValue &aVariant)
    : mCurrentValue(aVariant.mCurrentValue) {}

  JS_OBJECT_TYPE_METHODS(std::wstring, String, BSTR, VT_BSTR, ENotAString)
  JS_OBJECT_TYPE_METHODS(bool, Bool, BOOL, VT_BOOL, ENotABool)
  JS_OBJECT_TYPE_METHODS(int, Int, INT, VT_I4, ENotAnInt)
  JS_OBJECT_TYPE_METHODS(double, Double, double, VT_R8, ENotADouble)

  void attach(VARIANT &aVariant)
  {
    IF_FAILED_THROW(mCurrentValue.Attach(&aVariant));
  }

  bool isNull()
  {
    return mCurrentValue.vt == VT_EMPTY;
  }

  JSValue & operator=(JSValue aVal)
  {
    swap(*this, aVal);
    return *this;
  }

  JSValue
  operator[](int aIdx)
  {
    std::wostringstream oss;
    oss << aIdx;
    return operator[](oss.str());
  }

  JSValue
  operator[](const std::wstring &aProperty)
  {
    if (mCurrentValue.vt != VT_DISPATCH) {
      ANCHO_THROW(ENotAnObject());
    }

    CIDispatchHelper helper(mCurrentValue.pdispVal);

    DISPID did = 0;
    LPOLESTR lpNames[] = {(LPOLESTR)aProperty.c_str()};
    if (FAILED(mCurrentValue.pdispVal->GetIDsOfNames(IID_NULL, lpNames, 1, LOCALE_USER_DEFAULT, &did))) {
      return JSValue();
    }

    CComVariant result;
    DISPPARAMS params = {0};
    IF_FAILED_THROW(mCurrentValue.pdispVal->Invoke(did, IID_NULL, LOCALE_USER_DEFAULT, DISPATCH_PROPERTYGET, &params, &result, NULL, NULL));

    return JSValue(result);
  }
protected:
  CComVariant mCurrentValue;
};

void swap(JSValue &aVal1, JSValue &aVal2)
{
  std::swap(aVal1.mCurrentValue, aVal2.mCurrentValue);
}
