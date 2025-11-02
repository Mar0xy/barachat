import { render } from 'solid-js/web';
import { Router, Route } from '@solidjs/router';
import { Login, Chat } from './App';
import './index.css';

render(
  () => (
    <Router>
      <Route path="/" component={Login} />
      <Route path="/app" component={Chat} />
    </Router>
  ),
  document.getElementById('root')!
);
