<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<!DOCTYPE html>
<html>
<head>
    <title>JSP - Sample Page</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 40px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
        }
        .date-display {
            background-color: #e9ecef;
            padding: 10px;
            border-radius: 4px;
            margin: 15px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1><%= "Welcome to our Sample JSP Page!" %></h1>
        
        <p>This is a dynamically generated JSP page.</p>
        
        <div class="date-display">
            Current Time: <%= new java.util.Date() %>
        </div>
        
        <%
            String[] items = {"Java", "JSP", "Servlet", "JSTL"};
            out.println("<h2>Technologies:</h2>");
            out.println("<ul>");
            for(String item : items) {
                out.println("<li>" + item + "</li>");
            }
            out.println("</ul>");
        %>
        
        <form method="post" action="">
            <label for="name">Enter your name:</label><br>
            <input type="text" id="name" name="name"><br><br>
            <input type="submit" value="Submit">
        </form>
        
        <%
            String name = request.getParameter("name");
            if(name != null && !name.isEmpty()) {
                out.println("<h3>Hello, " + name + "!</h3>");
            }
        %>
        
        <br><br>
        <a href="index.jsp">Back to Home</a>
    </div>
</body>
</html>