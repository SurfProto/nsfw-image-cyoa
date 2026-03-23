"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "_rsc_lib_graph_checkpointer_ts";
exports.ids = ["_rsc_lib_graph_checkpointer_ts"];
exports.modules = {

/***/ "(rsc)/./lib/graph/checkpointer.ts":
/*!***********************************!*\
  !*** ./lib/graph/checkpointer.ts ***!
  \***********************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {\n__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   createCheckpointer: () => (/* binding */ createCheckpointer)\n/* harmony export */ });\n/* harmony import */ var _langchain_langgraph_checkpoint_postgres__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @langchain/langgraph-checkpoint-postgres */ \"(rsc)/./node_modules/@langchain/langgraph-checkpoint-postgres/dist/index.js\");\nvar __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_langchain_langgraph_checkpoint_postgres__WEBPACK_IMPORTED_MODULE_0__]);\n_langchain_langgraph_checkpoint_postgres__WEBPACK_IMPORTED_MODULE_0__ = (__webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__)[0];\n// LangGraph Checkpointer Configuration\n// Uses Supabase Postgres for persistence\n\nfunction createCheckpointer() {\n    const databaseUrl = process.env.DATABASE_URL;\n    if (!databaseUrl) {\n        throw new Error(\"DATABASE_URL is not set\");\n    }\n    return _langchain_langgraph_checkpoint_postgres__WEBPACK_IMPORTED_MODULE_0__.PostgresSaver.fromConnString(databaseUrl);\n}\n\n__webpack_async_result__();\n} catch(e) { __webpack_async_result__(e); } });//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9saWIvZ3JhcGgvY2hlY2twb2ludGVyLnRzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7O0FBQUEsdUNBQXVDO0FBQ3ZDLHlDQUF5QztBQUVnQztBQUVsRSxTQUFTQztJQUNkLE1BQU1DLGNBQWNDLFFBQVFDLEdBQUcsQ0FBQ0MsWUFBWTtJQUM1QyxJQUFJLENBQUNILGFBQWE7UUFDaEIsTUFBTSxJQUFJSSxNQUFNO0lBQ2xCO0lBRUEsT0FBT04sbUZBQWFBLENBQUNPLGNBQWMsQ0FBQ0w7QUFDdEMiLCJzb3VyY2VzIjpbIkM6XFxVc2Vyc1xcdmVyZXRcXERlc2t0b3BcXEltYWdlLWdlblxcbnNmdy1pbWFnZS1jeW9hXFxsaWJcXGdyYXBoXFxjaGVja3BvaW50ZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gTGFuZ0dyYXBoIENoZWNrcG9pbnRlciBDb25maWd1cmF0aW9uXHJcbi8vIFVzZXMgU3VwYWJhc2UgUG9zdGdyZXMgZm9yIHBlcnNpc3RlbmNlXHJcblxyXG5pbXBvcnQgeyBQb3N0Z3Jlc1NhdmVyIH0gZnJvbSBcIkBsYW5nY2hhaW4vbGFuZ2dyYXBoLWNoZWNrcG9pbnQtcG9zdGdyZXNcIjtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVDaGVja3BvaW50ZXIoKTogUG9zdGdyZXNTYXZlciB7XHJcbiAgY29uc3QgZGF0YWJhc2VVcmwgPSBwcm9jZXNzLmVudi5EQVRBQkFTRV9VUkw7XHJcbiAgaWYgKCFkYXRhYmFzZVVybCkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKFwiREFUQUJBU0VfVVJMIGlzIG5vdCBzZXRcIik7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gUG9zdGdyZXNTYXZlci5mcm9tQ29ublN0cmluZyhkYXRhYmFzZVVybCk7XHJcbn1cclxuIl0sIm5hbWVzIjpbIlBvc3RncmVzU2F2ZXIiLCJjcmVhdGVDaGVja3BvaW50ZXIiLCJkYXRhYmFzZVVybCIsInByb2Nlc3MiLCJlbnYiLCJEQVRBQkFTRV9VUkwiLCJFcnJvciIsImZyb21Db25uU3RyaW5nIl0sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./lib/graph/checkpointer.ts\n");

/***/ })

};
;