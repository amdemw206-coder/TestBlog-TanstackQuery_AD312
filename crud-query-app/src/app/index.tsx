import React, { useState } from 'react';
import { StyleSheet, Text, View, FlatList, TextInput, Button } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';


  

const fetchPost = async () => {
  const response = await fetch('https://jsonplaceholder.typicode.com/posts');
  return response.json();
};

const createPost = async (newPost: { title: string; body: string }) => {
  const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
    method: 'POST',
    body: JSON.stringify({ ...newPost, userId: 1 }),
    headers: { 'Content-type': 'application/json; charset=UTF-8' },
  });
  return response.json();
};

const updatePost = async (editPost: {userId: number; id: number; title: string; body: string}) => {
   const response = await fetch(`https://jsonplaceholder.typicode.com/posts/${editPost.id}`, {
    method: 'PUT',
    body: JSON.stringify(editPost), 
    headers: { 'Content-type': 'application/json; charset=UTF-8' },
  });
  return response.json(); 
}

const patchPost = async (specificPost: {id: number; title: string}) => {
  const response = await fetch(`https://jsonplaceholder.typicode.com/posts/${specificPost.id}`,{ 
  method: 'PATCH',
  body: JSON.stringify({title: specificPost.title}), 
  headers: { 'Content-type': 'application/json; charset=UTF-8' },
});
return response.json();
}

const deletePost = async (removePost: {id: number}) => {
  const response = await fetch(`https://jsonplaceholder.typicode.com/posts/${removePost.id}`,{ 
  method: 'DELETE'
});
return response.json();
}

export default function HomeScreen() {
  const queryClient = useQueryClient();
  
  // Minimalist State for Form
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [selectedPost, setSelectedPost] = useState<{userId: number; id: number; title: string; body: string} | null>(null)
  const [patchedPost, setPatchedPost] = useState<{id: number; title: string} | null>(null)


  // Fetching Posts Query
  const { status, data, error } = useQuery({ queryKey: ['posts'], queryFn: fetchPost });

  // Creating Post Mutation
  const mutation = useMutation({
    mutationFn: createPost,
    onSuccess: (data) => {
      // Refresh the list automatically after a successful post submission
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      console.log('Post created:', data);
      // Reset form fields
      setTitle('');
      setBody('');
    },
  });

  // Creating Filter
  const { data: filterData } = useQuery({
    queryKey: ['posts', userId],
    queryFn: () => fetch(
      userId
        ? `https://jsonplaceholder.typicode.com/posts?userId=${userId}`
        : `https://jsonplaceholder.typicode.com/posts`
    ).then(res => res.json()),
  }); 

  const handleSubmit = () => {
    if (title && body) {
      mutation.mutate({ title, body });
    }
  };

  const updatePostMutation = useMutation({
  mutationFn: updatePost,
  onSuccess: (data) => {
    console.log('Post updated:', data);
    queryClient.invalidateQueries({ queryKey: ['posts'] });
    setSelectedPost(null)
  },
});

  const patchPostMutation = useMutation({
  mutationFn: patchPost,
  onSuccess: (data) => {
    console.log('Post patched:', data);
    queryClient.invalidateQueries({ queryKey: ['posts'] });
    setPatchedPost(null);
  },
});

  const deletePostMutation = useMutation({
  mutationFn: deletePost,
  onSuccess: (data, variables) => {
    console.log('Post deleted:', variables);
    queryClient.invalidateQueries({ queryKey: ['posts'] });
  },
});

 const idCondition = userId ? filterData : data 
  
  if (status === 'pending') return <Text style={styles.loading}>Loading...</Text>;
  if (status === 'error') return <Text style={styles.error}>Error: {error?.message}</Text>;

  return (
    <SafeAreaView style={styles.mainContainer}>
      
      {/* Simple Form Block */}
      <View style={styles.form}>
        <TextInput 
          placeholder="Post Title" 
          value={title} 
          onChangeText={setTitle} 
          style={styles.input} 
        />
        <TextInput 
          placeholder="Post Body" 
          value={body} 
          onChangeText={setBody} 
          style={styles.input} 
        />
        <Button 
          title={mutation.isPending ? "Submitting..." : "Add New Post"} 
          onPress={handleSubmit} 
        />

        <TextInput
          placeholder="Filter"
          value={userId ?  userId.toString() : ''}
          onChangeText={(text) => setUserId(parseInt(text))}
          style={styles.input} 
        />

      </View>

      {/* Posts Edit Form */}
      {selectedPost && (
      <View>
        <Text>User ID: {selectedPost.userId}</Text>

        <Text>Post ID: {selectedPost.id}</Text>

        <TextInput
          value={selectedPost.title}
          onChangeText={(text) => setSelectedPost({ ...selectedPost, title: text })}
          placeholder="title"
        />

        <TextInput
          value={selectedPost.body}
          onChangeText={(text) => setSelectedPost({ ...selectedPost, body: text })}
          placeholder="body"
        />

        <Button 
          title={"Update Post"} 
          onPress={() => updatePostMutation.mutate(selectedPost)} 
        />
      </View>
     )}   

      {/* Patch of Posts */}
      {patchedPost && (
        <View>
          <TextInput
            value={patchedPost.title}
            onChangeText={(text) => setPatchedPost({ ...patchedPost, title: text })}
            placeholder='Patch Title'
          /> 
          <Button 
          title={"Patch Post"} 
          onPress={() => patchPostMutation.mutate(patchedPost)} 
        />
        </View>
      )}


      {/* FlatList of Posts */}
      <FlatList
        data={idCondition}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.container}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
            <Button
            title="Edit"
            onPress={() => setSelectedPost({
              userId: item.userId,
              id: item.id,
              title: item.title,
              body: item.body,
            })}
            />
            <Button
            title="Patch"
            onPress={() => setPatchedPost({
              id: item.id, 
              title: item.title
            })}
            />
            <Button
            title="Delete"
            onPress={() => deletePostMutation.mutate(item.id)}
            />
          </View>        
        )}
      />

    </SafeAreaView>
  );
}

// --- Minimalist Styles ---

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  form: {
    padding: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#f1ac13',
    backgroundColor: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
    marginBottom: 8,
  },
  container: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  body: {
    color: '#666',
  },
  loading: { textAlign: 'center', marginTop: 40 },
  error: { color: 'red', textAlign: 'center', marginTop: 40 },
});