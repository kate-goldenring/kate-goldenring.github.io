import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Gallery from './components/Gallery';
import BlogPost from './components/BlogPost';
import PostList from './components/admin/PostList';
import PostForm from './components/admin/PostForm';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Gallery />} />
        <Route path="/post/:id" element={<BlogPost />} />
        <Route path="/admin" element={<PostList />} />
        <Route path="/admin/new" element={<PostForm />} />
        <Route path="/admin/edit/:id" element={<PostForm />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
