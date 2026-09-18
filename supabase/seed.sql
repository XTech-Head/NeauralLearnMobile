-- supabase/seed.sql — run after schema.sql for demo content
insert into categories (name, icon, color) values
  ('Machine Learning', 'analytics', '#A78BFA'),
  ('Prompt Engineering', 'chatbubbles', '#6EE7B7'),
  ('Data Science', 'stats-chart', '#FCD34D'),
  ('AI Ethics', 'shield-checkmark', '#F87171');

insert into instructors (name, bio) values
  ('Maya Chen', 'ML researcher, ex-DeepMind'),
  ('Josh Rivera', 'Prompt engineer & educator'),
  ('Dr. Amara Okafor', 'Data science professor');

insert into courses (title, description, category_id, instructor_id, duration_minutes, difficulty, is_free, rating)
select
  'Neural Networks 101',
  'A gentle, visual introduction to how neural networks actually learn.',
  c.id, i.id, 120, 'beginner', true, 4.8
from categories c, instructors i
where c.name = 'Machine Learning' and i.name = 'Maya Chen';

insert into courses (title, description, category_id, instructor_id, duration_minutes, difficulty, is_free, rating)
select
  'Mastering Prompt Design',
  'Write prompts that get consistently better output from any LLM.',
  c.id, i.id, 90, 'beginner', true, 4.9
from categories c, instructors i
where c.name = 'Prompt Engineering' and i.name = 'Josh Rivera';

insert into courses (title, description, category_id, instructor_id, duration_minutes, difficulty, is_free, rating)
select
  'Data Analysis with Python',
  'Pandas, NumPy, and real datasets — from zero to your first analysis.',
  c.id, i.id, 180, 'intermediate', true, 4.6
from categories c, instructors i
where c.name = 'Data Science' and i.name = 'Dr. Amara Okafor';

-- Lessons for "Neural Networks 101"
insert into lessons (course_id, title, content, order_index, duration_minutes, xp_reward)
select id, 'What is a neuron?', 'A single artificial neuron takes inputs, weights them, and applies an activation function...', 0, 8, 15
from courses where title = 'Neural Networks 101';

insert into lessons (course_id, title, content, order_index, duration_minutes, xp_reward)
select id, 'Layers and forward pass', 'Stacking neurons into layers lets the network represent complex functions...', 1, 10, 15
from courses where title = 'Neural Networks 101';

insert into lessons (course_id, title, content, order_index, duration_minutes, xp_reward)
select id, 'Backpropagation, intuitively', 'How the network learns from its mistakes by adjusting weights backward...', 2, 12, 20
from courses where title = 'Neural Networks 101';

-- Achievements
insert into achievements (name, description, icon, xp_reward) values
  ('First Steps', 'Complete your first lesson', 'footsteps', 10),
  ('On a Roll', 'Hit a 3-day streak', 'flame', 25),
  ('Course Finisher', 'Complete your first course', 'trophy', 50),
  ('Curious Mind', 'Ask the AI tutor 5 questions', 'sparkles', 15),
  ('Quiz Whiz', 'Pass your first quiz', 'checkmark-done-circle', 20),
  ('Builder', 'Submit your first project', 'construct', 30);

-- Quiz for "Neural Networks 101"
insert into quizzes (course_id, title, passing_score, xp_reward)
select id, 'Neural Networks 101 — Final Quiz', 70, 30
from courses where title = 'Neural Networks 101';

insert into quiz_questions (quiz_id, question, order_index)
select id, 'What does a single artificial neuron compute?', 0
from quizzes where title = 'Neural Networks 101 — Final Quiz';

insert into quiz_options (question_id, option_text, is_correct, order_index)
select id, 'A weighted sum of inputs passed through an activation function', true, 0
from quiz_questions where question = 'What does a single artificial neuron compute?'
union all
select id, 'The average of all training labels', false, 1
from quiz_questions where question = 'What does a single artificial neuron compute?'
union all
select id, 'A random number for initialization', false, 2
from quiz_questions where question = 'What does a single artificial neuron compute?';

insert into quiz_questions (quiz_id, question, order_index)
select id, 'What is backpropagation used for?', 1
from quizzes where title = 'Neural Networks 101 — Final Quiz';

insert into quiz_options (question_id, option_text, is_correct, order_index)
select id, 'Adjusting weights based on the error, working backward through the network', true, 0
from quiz_questions where question = 'What is backpropagation used for?'
union all
select id, 'Loading training data into memory', false, 1
from quiz_questions where question = 'What is backpropagation used for?'
union all
select id, 'Splitting data into train/test sets', false, 2
from quiz_questions where question = 'What is backpropagation used for?';

insert into quiz_questions (quiz_id, question, order_index)
select id, 'Why do we stack multiple layers in a network?', 2
from quizzes where title = 'Neural Networks 101 — Final Quiz';

insert into quiz_options (question_id, option_text, is_correct, order_index)
select id, 'To represent more complex, non-linear functions', true, 0
from quiz_questions where question = 'Why do we stack multiple layers in a network?'
union all
select id, 'To make training faster', false, 1
from quiz_questions where question = 'Why do we stack multiple layers in a network?'
union all
select id, 'It has no real effect', false, 2
from quiz_questions where question = 'Why do we stack multiple layers in a network?';

-- Project for "Neural Networks 101"
insert into projects (course_id, title, description, instructions, xp_reward)
select
  id,
  'Build a 2-layer network by hand',
  'Apply what you learned by working through a tiny network on paper or in a notebook.',
  'Pick 2 inputs, 1 hidden layer with 2 neurons, and 1 output neuron. Assign your own weights, ' ||
  'compute the forward pass for one example, then describe what you''d change if the output was wrong. ' ||
  'Share your working (a photo of your notes, a notebook link, or just a written walkthrough) below.',
  50
from courses where title = 'Neural Networks 101';

-- Demo prerequisite: "Data Analysis with Python" requires finishing
-- "Neural Networks 101" first (arbitrary demo linkage — set to null or
-- point anywhere via the Supabase table editor to change it).
update courses
set prerequisite_course_id = (select id from courses where title = 'Neural Networks 101')
where title = 'Data Analysis with Python';