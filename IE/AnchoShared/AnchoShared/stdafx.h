// stdafx.h : include file for standard system include files,
// or project specific include files that are used frequently,
// but are changed infrequently

#pragma once

#ifndef STRICT
#define STRICT
#endif

#include "AnchoShared/targetver.h"

#define _ATL_APARTMENT_THREADED
#define _ATL_NO_AUTOMATIC_NAMESPACE

#define _ATL_CSTRING_EXPLICIT_CONSTRUCTORS	// some CString constructors will be explicit

#include "AnchoShared/resource.h"
#include <atlbase.h>
#include <atlstr.h>
#include <atlcom.h>
#include <atlctl.h>
#include <atlcoll.h>
#include <atlsafe.h>

#include <shlguid.h>
#include <exdispid.h>
#include <activscp.h>

#include <anchocommons.h>

using namespace ATL;

// helper
#include "libbhohelper.h"
using namespace LIB_BhoHelper;

#define _DEBUG_BREAK
#ifdef _DEBUG_BREAK
#define ASSERT_ ATLASSERT
#else
#define ASSERT_
#endif

#define IF_FAILED_RET(_hr) \
  do \
  { \
    HRESULT _hr__ = _hr; \
    ASSERT_(SUCCEEDED(_hr__)); \
    if (FAILED(_hr__)) \
    { \
      ATLTRACE(_T("ASSERTION FAILED: 0x%08x in "), _hr__); \
      ATLTRACE(__FILE__); \
      ATLTRACE(_T(" line %i\n"), __LINE__); \
      return _hr__; \
    } \
  } while(0);

#define IF_FAILED_RET2(_hr, _ret) \
  do \
  { \
    HRESULT _hr__ = _hr; \
    ASSERT_(SUCCEEDED(_hr__)); \
    if (FAILED(_hr__)) \
    { \
      ATLTRACE(_T("ASSERTION FAILED: 0x%08x in "), _hr__); \
      ATLTRACE(__FILE__); \
      ATLTRACE(_T(" line %i\n"), __LINE__); \
      return _ret; \
    } \
  } while(0);

#define IF_FAILED_BREAK(_hr, _hrRet) \
    _hrRet = _hr; \
    ASSERT_(SUCCEEDED(_hrRet)); \
    if (FAILED(_hrRet)) \
    { \
      ATLTRACE(_T("ASSERTION FAILED: 0x%08x in "), _hrRet); \
      ATLTRACE(__FILE__); \
      ATLTRACE(_T(" line %i\n"), __LINE__); \
      break; \
    }

#define ENSURE_RETVAL(_val) \
  if (!_val) return E_POINTER;

#include <Exceptions.h>
#include <SimpleWrappers.h>