import { render } from 'solid-js/web';
import { Router, Route } from '@solidjs/router';
import App from './App';
import './index.css';

render(
  () => (
    <Router>
      <Route path="/*" component={App} />
    </Router>
  ),
  document.getElementById('root')!
);
