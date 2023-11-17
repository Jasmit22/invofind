import { useState, useEffect } from "react";
import Togglable from "./components/Togglable";
import LoginForm from "./components/LoginForm";
import loginService from "./services/login";
import taskService from "./services/tasks";
import Notification from "./components/Notification";
import Task from "./components/Task";
import AddTaskForm from "./components/AddTaskForm";

import "./App.css";
import "./Task.css";

function App() {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [newFilter, setNewFilter] = useState("");

  useEffect(() => {
    const loggedUserJSON = window.localStorage.getItem("loggedAppUser");
    if (loggedUserJSON) {
      const user = JSON.parse(loggedUserJSON);
      setUser(user);
      taskService.setToken(user.token);
    }
  }, []);

  useEffect(() => {
    const invofindHeading = document.querySelector(".invofindHeading");
    if (invofindHeading) {
      invofindHeading.innerHTML = invofindHeading.innerText
        .split("")
        .map(
          (letters, i) =>
            `<span style = "transition-delay:${i * 30}ms;
          filter: hue-rotate(${i * 15}deg)"›$">${letters}</span>`
        )
        .join("");
    }
  }, []);

  useEffect(() => {
    taskService.getAll().then((tasks) => {
      setTasks([...tasks]);
    });
  }, []);

  const checkLoginStatus = () => {
    const decode = JSON.parse(atob(user.token.split(".")[1]));
    if (decode.exp * 1000 < new Date().getTime()) {
      window.localStorage.removeItem("loggedAppUser");
      setUser(null);
      setErrorMessage("Session Timed Out. Please Log In Again.");
      return true;
    }
    return false;
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    try {
      const user = await loginService.login({
        username,
        password,
      });
      taskService.setToken(user.token);
      window.localStorage.setItem("loggedAppUser", JSON.stringify(user));
      setUser(user);
      setUsername("");
      setPassword("");
    } catch (exception) {
      setErrorMessage(exception.response.data.error);
      setTimeout(() => {
        setErrorMessage(null);
      }, 4000);
      console.log(exception);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    return task.content.toUpperCase().includes(newFilter.toUpperCase());
  });

  String.prototype.toProperCase = function () {
    return this.replace(/\w\S*/g, function (txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  };

  const showTasks = () => {
    return (
      <div className="allTasks">
        {user !== null && user.admin && renderAddTask()}
        <input
          className="filterTasks"
          onChange={(event) => setNewFilter(event.target.value)}
          value={newFilter}
          placeholder={"Filter Tasks"}
        />
        <div className="flex justify-center w-full">
          <table className="w-full">
            <tbody>
              {filteredTasks.map((task) => (
                <tr key={task.id}>
                  <td>{task.content.toProperCase()}</td>
                  <Task
                    task={task}
                    markResolved={markResolved}
                    user={user}
                    deleteTask={deleteTask}
                  />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const markResolved = async (task) => {
    if (!checkLoginStatus()) {
      const newTask = { ...task };
      newTask.resolved = !task.resolved;

      await taskService.update(task.id, newTask);

      taskService.getAll().then((tasks) => setTasks([...tasks]));
    }
  };

  const addTask = (task) => {
    if (!checkLoginStatus()) {
      console.log(task.content);
      if (task.content !== null) {
        taskService.create(task).then((returnedTask) => {
          console.log(returnedTask);
          setTasks(tasks.concat(returnedTask));
        });
      }
    }
  };

  const deleteTask = async (task) => {
    if (!checkLoginStatus()) {
      if (window.confirm("Are you sure you want to delete this task?")) {
        try {
          await taskService.remove(task.id);
          const updatedTasks = await taskService.getAll();
          setTasks(updatedTasks);
        } catch (error) {
          console.error("Error deleting the task:", error);
        }
      }
    }
  };

  const renderLogin = () => {
    return (
      <div>
        <Togglable buttonLabel="Log In">
          <LoginForm
            handleSubmit={handleLogin}
            handleUsernameChange={({ target }) => setUsername(target.value)}
            handlePasswordChange={({ target }) => setPassword(target.value)}
            username={username}
            password={password}
          />
        </Togglable>
      </div>
    );
  };

  const renderLogout = () => {
    return (
      <div className="logOut">
        <button
          onClick={() => {
            if (
              window.confirm(`Are you sure you want to log out ${user.name}?`)
            ) {
              window.localStorage.removeItem("loggedAppUser");
              setUser(null);
            }
          }}
        >
          Log out
        </button>
      </div>
    );
  };

  const renderAddTask = () => {
    return (
      <div className="addTask">
        <Togglable buttonLabel="Add Task">
          <AddTaskForm createTask={addTask} />
        </Togglable>
      </div>
    );
  };

  function openInfo(evt, infoName) {
    // Declare all variables
    var i, tabcontent, tablinks;

    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
      tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
      tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(infoName).style.display = "block";
    evt.currentTarget.className += " active";
  }

  const showSample = () => {
    return (
      <div className="rendering">
        <div className="tab">
          <button
            className="tablinks"
            onClick={(event) => openInfo(event, "Info1")}
          >
            Tasks
          </button>
          <button
            className="tablinks"
            onClick={(event) => openInfo(event, "Info2")}
          >
            Items
          </button>
          <button
            className="tablinks"
            onClick={(event) => openInfo(event, "Info3")}
          >
            Issues
          </button>
        </div>

        <div id="Info1" className="tabcontent">
          {showTasks()}
        </div>

        <div id="Info2" className="tabcontent">
          <h1>Items</h1>
        </div>

        <div id="Info3" className="tabcontent">
          <h1>Issues</h1>
        </div>
      </div>
    );
  };

  return (
    <div className="w-screen">
      <div className="flex fixed z-100 top-0 w-full justify-between pl-1 h-15 items-center bg-[#373b4c] border-solid border-[#a0d2eb] border-b">
        <div className="invofindHeading">InvoFind 🔍</div>
        {user !== null && renderLogout()}
      </div>

      <div className="content">
        <Notification message={errorMessage} />
        {user === null && renderLogin()}
        {user !== null && showSample()}
      </div>
    </div>
  );
}

export default App;
