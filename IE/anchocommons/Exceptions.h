#pragma once

#include <stdexcept>

//TODO - create proper exception hierarchy
struct EInvalidPointer: std::exception { };
struct ECast: std::exception { };
struct ENotAnObject: ECast { };
struct ENotAString: ECast { };
struct ENotAnInt: ECast { };
struct ENotADouble: ECast { };
struct ENotABool: ECast { };

struct EHResult: std::exception
{ 
  EHResult(HRESULT hr): mHResult(hr) {}
  HRESULT mHResult;
};

#define ANCHO_THROW(...) \
  throw __VA_ARGS__


inline HRESULT exceptionToHRESULT()
{
  try {
    throw;
  } catch (EInvalidPointer&) {
    ATLTRACE("ERROR: Invalid pointer\n");
    return E_POINTER;
  } catch(ECast &) {
    ATLTRACE("ERROR: Wrong cast\n");
    return E_INVALIDARG;
  } catch(EHResult &e) {
    ATLTRACE("ERROR: HRESULT = %d\n", e.mHResult);
    return e.mHResult;
  } catch (std::exception &e) {
    ATLTRACE("ERROR: %s\n", e.what());
    return E_FAIL;
  }
}

inline void
hresultToException(HRESULT hr)
{
  ANCHO_THROW(EHResult(hr));
}

#define IF_THROW_RET(...) \
  try { \
    __VA_ARGS__ ; \
} catch (...) { \
  return exceptionToHRESULT();\
}

#define BEGIN_TRY_BLOCK try {

#define END_TRY_BLOCK_CATCH_TO_HRESULT \
} catch (...) { \
  return exceptionToHRESULT();\
}

#define IF_FAILED_THROW(...) \
  HRESULT _hr__ = __VA_ARGS__;\
  if (FAILED(_hr__)) {\
    hresultToException(_hr__);\
  }
