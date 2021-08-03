import { html } from 'lit';

export default {
  title: 'Misc. / Script Tag',
};

export const inTemplate = () => html`
  <div>JS alert</div>
  <script>
    alert('hello');
  </script>
`;

export const inString = () => '<div>JS alert</div><script>alert("hello")</script>';
