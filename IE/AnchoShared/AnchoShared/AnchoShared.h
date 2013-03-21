#pragma once

#if defined(AnchoShared_EXPORTS) // inside DLL
#   define ANCHOSHARED_API   __declspec(dllexport) __stdcall
#else // outside DLL
#   define ANCHOSHARED_API  __declspec(dllimport) __stdcall
#endif  // ANCHOSHARED_EXPORTS

HRESULT ANCHOSHARED_API createAnchoXHRInstance(IAnchoXmlHttpRequest** ppRet);
