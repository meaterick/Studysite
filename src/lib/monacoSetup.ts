"use client";

import { loader } from "@monaco-editor/react";

// 코드 편집기(Monaco)를 외부 CDN(jsdelivr) 대신 이 사이트의 /vendor/monaco에서 불러온다.
// 파일은 빌드 직전에 node_modules/monaco-editor에서 복사된다(scripts/copy-monaco.mjs).
// 편집기를 쓰는 컴포넌트가 이 파일을 import하면, 첫 편집기가 뜨기 전에 설정이 적용된다.
loader.config({ paths: { vs: "/vendor/monaco/vs" } });
