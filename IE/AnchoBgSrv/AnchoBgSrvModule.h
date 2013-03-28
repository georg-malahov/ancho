/****************************************************************************
 * AnchoBgSrvModule.h : Declaration of CAnchoBgSrvModule
 * Copyright 2012 Salsita software (http://www.salsitasoft.com).
 * Author: Arne Seib <kontakt@seiberspace.de>
 ****************************************************************************/

#pragma once
#include "AnchoBgSrv_i.h"

/*============================================================================
 * class CAnchoBgSrvModule
 */
class CAnchoBgSrvModule : public CAtlExeModuleT< CAnchoBgSrvModule >
{
public :
  typedef HRESULT (__stdcall * fnDllRegisterServer)(void);

  HINSTANCE m_hInstance;
  DECLARE_LIBID(LIBID_AnchoBgSrvLib)

  static HRESULT WINAPI UpdateRegistryAppId(BOOL bRegister) throw()
  {
    wchar_t modulePath[MAX_PATH];
    HINSTANCE hInstance = ::GetModuleHandle(NULL);
    ::GetModuleFileName(hInstance, modulePath, MAX_PATH);
    LPWSTR fileName = PathFindFileName(modulePath);
    ATLASSERT(fileName > modulePath);

    // Null-terminate the path.
    *(fileName-1) = 0;

    ATL::_ATL_REGMAP_ENTRY aMapEntries [] =
    {
      { OLESTR("APPID"), L"{FBA7ED0C-1181-476A-AEDE-F0AF49EF80F7}" },
      { OLESTR("MODULEPATH"), modulePath },
      { OLESTR("OBJECTFILENAME"), fileName },
      { NULL, NULL }
    };
    return ATL::_pAtlModule->UpdateRegistryFromResource(IDR_ANCHOBGSRV, bRegister, aMapEntries);
  }

  //----------------------------------------------------------------------------
  // Parses the command line and registers/unregisters the rgs file if necessary
  bool ParseCommandLine(LPCTSTR lpCmdLine, HRESULT* pnRetCode) throw();
  HMODULE GetResourceInstance();

private:
  typedef enum
  {
    ACTION_RUN = 0,
    ACTION_REGISTER,
    ACTION_UNREGISTER,
    ACTION_REGISTER_PER_USER,
    ACTION_UNREGISTER_PER_USER
  } SRVACTION;
};

extern CAnchoBgSrvModule _AtlModule;
