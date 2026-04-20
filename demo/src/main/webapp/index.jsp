<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<html>
<head>
  <title>实验四：JSP 脚本元素综合应用</title>
  <style>
    body {
      font-family: "Microsoft YaHei", sans-serif;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background-color: #fff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    /* 头部样式 */
    .header-box {
      background-color: #e1f3d8;
      border: 1px solid #67c23a;
      padding: 15px;
      margin-bottom: 25px;
      text-align: center;
      font-weight: bold;
      color: #333;
      font-size: 16px;
      border-radius: 4px;
    }
    .section {
      margin-bottom: 30px;
      border-bottom: 1px dashed #ccc;
      padding-bottom: 20px;
    }
    .section:last-child {
      border-bottom: none;
    }
    h3 { color: #409EFF; border-left: 4px solid #409EFF; padding-left: 10px; }

    /* 表格样式 */
    table { border-collapse: collapse; margin: 15px auto; width: 100%; }
    td {
      border: 1px solid #999;
      padding: 6px;
      text-align: center;
      font-size: 14px;
    }
    /* 偶数行背景色，模仿图示效果 */
    tr:nth-child(even) { background-color: #fafafa; }

    .result-text { font-size: 16px; line-height: 1.6; }
    .highlight { color: #E6A23C; font-weight: bold; font-size: 18px; }
  </style>
</head>
<body>

<div class="container">
  <!-- 头部信息：直接写在页面中，包含学号和姓名 -->
  <!-- 请在此处修改为你的真实学号和姓名 -->
  <div class="header-box">
    学号：2307020218 &nbsp;&nbsp; 姓名：张松泉
  </div>

  <!-- 任务一：输出 26 个小写英文字母表 -->
  <div class="section">
    <h3>任务一：输出 26 个小写英文字母表</h3>
    <div class="result-text">
      <%
        // 使用 Java 程序片 (<% %>) 输出字母
      for (char c = 'a'; c <= 'z'; c++) {
      out.print(c + " ");
      }
      %>
    </div>
  </div>

  <!-- 任务二：简单的计数器 -->
  <div class="section">
    <h3>任务二：简单的计数器 (利用成员变量共享)</h3>
    <div class="result-text">
      <%
        // 【关键点】使用 JSP 声明 (<%! %>) 定义成员变量
      // 成员变量属于 Servlet 类实例，被所有用户请求共享
      int visitCount = 0;
      %>

      <%
        // 每次访问页面时执行此代码块，计数器加 1
        // 注意：在高并发生产环境中通常需要 synchronized 同步，但实验环境通常忽略
        visitCount++;
      %>

      <p>欢迎访问本网站！</p>
      <p>您是第 <span class="highlight"><%= visitCount %></span> 个访问本站的客户。</p>
      <p style="font-size: 12px; color: #999;">(提示：刷新页面或在新窗口打开，数字会增加)</p>
    </div>
  </div>

  <!-- 任务三：输出 15*10 表格 -->
  <div class="section">
    <h3>任务三：输出 15列 * 10行 的乘法表格</h3>
    <table>
      <%
        // 外层循环控制行：1 到 10
        for (int i = 1; i <= 10; i++) {
          out.println("<tr>");
          // 内层循环控制列：1 到 15
          for (int j = 1; j <= 15; j++) {
            int result = i * j;
            out.println("<td>" + result + "</td>");
          }
          out.println("</tr>");
        }
      %>
    </table>
  </div>
</div>

</body>
</html>