import { useEffect, useState } from 'react';
import axios from "axios";
import './styles.css';
import { set } from 'mongoose';

function App() {


  const [showForm, setShowForm] = useState(false);
  const [facts, setFacts] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [currentCategory, setCurrentCategory] = useState('all');

  useEffect(() => {
    async function getFacts() {
      setIsLoading(true);
     
      try {
        const response = await axios.get('http://localhost:5000/api/facts', {
          params: {
            category: currentCategory,
          },
        });
        // console.log(response.data);
        const sortedFacts = response.data.sort(
          (a, b) => b.votesInteresting - a.votesInteresting
        );
        setFacts(sortedFacts);
      } catch (error) {
        console.error('Error fetching facts:', error);
      } finally {
        setIsLoading(false);
      }
    }

    getFacts();

  }, [currentCategory]);

  return (

    <>
      <Header showForm={showForm} setShowForm={setShowForm} />
      {showForm ? (
        <NewFactForm setFacts={setFacts} setShowForm={setShowForm} />
      ) : null}

      <main className='main'>
        <CategoryFilter setCurrentCategory={setCurrentCategory} />

        {isLoading ? (
          <Loader />
        ) : (
          <FactList facts={facts} setFacts={setFacts} />
        )}
      </main>
    </>
  );
}

function Loader() {
  return <p className='message'>Loading...</p>;
}

function Header({ showForm, setShowForm }) {
  const appTitle = 'LEARN EVERYDAY';

  return (
    <header className='header'>
      <div className='logo'>
        <img src='https://static.vecteezy.com/system/resources/thumbnails/000/586/123/small/sarmi2-08.jpg' height='68' width='68' alt='Today I Learned Logo' />
        <h1>{appTitle}</h1>
      </div>

      <button
        className='btn btn-large btn-open'
        onClick={() => setShowForm((show) => !show)}
      >
        {showForm ? 'Close' : 'Share a fact'}
      </button>
    </header>
  );
}

const CATEGORIES = [
  { name: 'technology', color: '#3b82f6' },
  { name: 'science', color: '#16a34a' },
  { name: 'finance', color: '#ef4444' },
  { name: 'society', color: '#eab308' },
  { name: 'entertainment', color: '#db2777' },
  { name: 'health', color: '#14b8a6' },
  { name: 'history', color: '#f97316' },
  { name: 'news', color: '#8b5cf6' },
];

function isValidHttpUrl(string) {
  let url;
  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }
  return url.protocol === 'http:' || url.protocol === 'https:';
}

function NewFactForm({ setFacts, setShowForm }) {
  const [text, setText] = useState('');
  const [source, setSource] = useState('');
  const [category, setCategory] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const textLength = text.length;

  function generateRandomId() {
    return Math.round(Math.random() * 10000000);
  }

  function createNewFact() {
    return {

      text,
      source,
      category,
      votesInteresting: 0,
      votesMindblowing: 0,
      votesFalse: 0,

    };
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (text && isValidHttpUrl(source) && category && textLength <= 200) {
      const newFact = createNewFact();

      setFacts((facts) => [newFact, ...facts]);
      async function posttoapi() {

        await axios.post("http://localhost:5000/api/facts", newFact);
      }
      posttoapi();
      setText('');
      setSource('');
      setCategory('');

      setShowForm(false);
    }
  }

  return (
    <form className='fact-form' onSubmit={handleSubmit}>
      <input
        type='text'
        placeholder='Share a fact with the world...'
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={isUploading}
      />
      <span>{200 - textLength}</span>
      <input
        value={source}
        type='text'
        placeholder='Trustworthy source...'
        onChange={(e) => setSource(e.target.value)}
        disabled={isUploading}
      />
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        disabled={isUploading}
      >
        <option value=''>Choose category:</option>
        {CATEGORIES.map((cat) => (
          <option key={cat.name} value={cat.name}>
            {cat.name.toUpperCase()}
          </option>
        ))}
      </select>
      <button className='btn btn-large' disabled={isUploading}>
        Post
      </button>
    </form>
  );
}

function CategoryFilter({ setCurrentCategory }) {
  return (
    <aside>
      <ul>
        <li className='category'>
          <button
            className='btn btn-all-categories'
            onClick={() => { setCurrentCategory('all') }}
          >
            All
          </button>
        </li>

        {CATEGORIES.map((cat) => (
          <li key={cat.name} className='category'>
            <button
              className='btn btn-category'
              style={{ backgroundColor: cat.color }}
              onClick={() => setCurrentCategory(cat.name)}
            >
              {cat.name}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function FactList({ facts, setFacts }) {
  if (facts.length === 0)
    return (
      <p className='message'>
        No facts for this category yet! Create the first one ✌️
      </p>
    );

  return (
    <section>
      <ul className='facts-list'>
        {facts.map((fact) => (
          <Fact key={fact._id} fact={fact} facts={facts} setFacts={setFacts} />
        ))}
      </ul>
      <p>There are {facts.length} facts in the database. Add your own!</p>
    </section>
  );
}


function Fact({ fact, facts, setFacts }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const isDisputed =
    fact.votesInteresting + fact.votesMindblowing < fact.votesFalse;

   function handleVote(columnName) {
    setIsUpdating(true);
    const updatedFacts = facts.map((f) => {
      if (f._id === fact._id) {
        return {
          ...f,
          [columnName]: f[columnName] + 1,
        };
      }
      return f;
    });
    setFacts(updatedFacts);

    try {
       patchToApi(columnName);
     
    } catch (error) {
      console.error("Error while patching:", error);
    }
    async function patchToApi(columnName) {
      console.log(columnName, fact._id, typeof fact._id);
      await axios.patch('http://localhost:5000/api/facts', {
        factID: fact._id,
        typeofbutton: columnName,
        count: fact[columnName] + 1,
      });
    
    }

    setIsUpdating(false);
    // console.log(isUpdating);
  }

  return (
    <li className='fact'>
      <p>
        {isDisputed ? <span className='disputed'>[⛔️ DISPUTED]</span> : null}
        {fact.text}
        <a className='source' href={fact.source} target='_blank' rel='noopener noreferrer'>
          (Source)
        </a>
      </p>
      <span
        className='tag'
        style={{
          backgroundColor: CATEGORIES.find((cat) => cat.name === fact.category).color,
        }}
      >
        {fact.category}
      </span>
      <div className='vote-buttons'>
        <button
          onClick={() => handleVote('votesInteresting')}
          disabled={isUpdating}
        >
          👍 {fact.votesInteresting}
        </button>
        <button
          onClick={() => handleVote('votesMindblowing')}
          disabled={isUpdating}
        >
          🤯 {fact.votesMindblowing}
        </button>
        <button onClick={() => handleVote('votesFalse')} disabled={isUpdating}>
          ⛔️ {fact.votesFalse}
        </button>
      </div>
    </li>
  );
}

export default App;
