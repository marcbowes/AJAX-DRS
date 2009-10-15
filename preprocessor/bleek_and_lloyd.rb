require 'rexml/document'
require 'activerecord'

ActiveRecord::Base.establish_connection({
  'adapter'  => 'mysql',
  'encoding' => 'utf8',
  'host'     => 'localhost',
  'database' => 'bal',
  'username' => 'root',
  'password' => '',
  'socket'   => '/var/run/mysqld/mysqld.sock',
  'charset'  => 'utf8'
})

def normalize(filename)
  puts 'Loading document'
  start = Time.now
  doc   = REXML::Document.new(File.new(filename))
  root  = doc.root
  puts "Loading complete (#{Time.now - start} seconds)"
  
  # Going from the top of the XML document
  puts 'Loading stories'
  start = Time.now
  root.elements['stories'].reject { |e| !e.is_a? REXML::Element }.each do |story|
    s = Story.new
    
    # Attributes
    s.id          = story.elements['id'].text.to_i
    s.title       = story.elements['title'].try(:text)
    s.summary     = story.elements['summary'].try(:text)
    s.comments    = story.elements['comments'].try(:text)
    s.date        = story.elements['date'].try(:text)
    s.storypages  = story.elements['storypages'].try(:text)
    
    # Associations
    collection_name = story.elements['collection'].try(:text)
    unless collection_name.blank?
      s.collection = Collection.find_or_create_by_name(collection_name)
    end
    
    # Empty attributes and associations:
    # keywords, subkeywords, category and author come later
    s.save
  end
  puts "#{Story.count} stories loaded (#{Time.now - start} seconds)"
  
  puts 'Loading categories'
  start = Time.now
  root.elements['categories'].reject { |e| !e.is_a? REXML::Element }.each do |category|
    c = Category.find_or_create_by_name(category.elements['name'].text)
    c.stories << Story.find(category.elements['id'].text.to_i)
    c.save
  end
  puts "#{Category.count} categories loaded (#{Time.now - start} seconds)"
  
  puts 'Loading authors'
  start = Time.now
  root.elements['authors'].reject { |e| !e.is_a? REXML::Element }.each do |author|
    a = Author.find_or_create_by_name(author.elements['name'].text)
    a.stories << Story.find(author.elements['id'].text.to_i)
    a.save
  end
  puts "#{Author.count} authors loaded (#{Time.now - start} seconds)"
  
  puts 'Loading keywords'
  loaded = 0
  start = Time.now
  root.elements['keywords'].reject { |e| !e.is_a? REXML::Element }.each do |keyword|
    s = Story.find(keyword.elements['id'].text.to_i)
    
    kw = keyword.elements['kw'].try(:text)
    if kw
      array = kw.split(/\s/)
      loaded = loaded + array.size
      s.keywords ||= []
      s.keywords.push *array
    end
    
    subkw = keyword.elements['subkw'].try(:text)
    if subkw
      array = subkw.split(/\s/)
      loaded = loaded + array.size
      s.subkeywords ||= []
      s.subkeywords.push *array
    end
    
    s.save
  end
  puts "#{loaded} keywords loaded (#{Time.now - start} seconds)"
    
  puts 'Loading pages (to stories)'
  loaded = 0
  start = Time.now
  root.elements['pages'].reject { |e| !e.is_a? REXML::Element }.each do |story|
    s = Story.find(story.attributes['id'].to_i)
    
    story.elements.reject { |e| !e.is_a? REXML::Element }.each do |page|
      p = Page.find_or_create_by_name(page.text)
      s.pages << p
      loaded = loaded + 1
    end
    
    s.save
  end
  puts "#{loaded} pages (to stories) loaded (#{Time.now - start} seconds)"
  
  puts 'Loading books'
  start = Time.now
  root.elements['books'].reject { |e| !e.is_a? REXML::Element }.each do |collection|
    c = Collection.find_or_create_by_name(collection.attributes['name'])
    
    collection.elements.reject { |e| !e.is_a? REXML::Element }.each do |book|
      b = Book.new({
        :name           => book.attributes['name'],
        :first_page_id  => Page.find_by_name(book.attributes['first']).id,
        :last_page_id   => Page.find_by_name(book.attributes['last']).id,
        :collection_id  => c.id
      })
      
      book.elements.reject { |e| !e.is_a? REXML::Element }.each do |page|
        p = Page.find_or_create_by_name(page.text)
        b.pages << p
      end
      
      b.save
    end
  end
  puts "#{Book.count} books loaded (#{Time.now - start} seconds)"
end

class Caljaxize
  
end

class Collection < ActiveRecord::Base
  has_many :books
  
  #
  # attributes:
  # - name
  #
end

class Book < ActiveRecord::Base
  belongs_to :collection
  
  has_many :pages
  
  #
  # attributes:
  # - name:string
  # - collection:references
  # - first_page:references
  # - last_page:references
  #
  
  def first_page
    Page.find(self.first_page_id)
  end
  
  def last_page
    Page.find(self.last_page_id)
  end
end

class Category < ActiveRecord::Base
  has_many :stories
  
  #
  # attributes:
  # - name:string
  #
end

class Author < ActiveRecord::Base
  has_many :stories
  
  #
  # attributes:
  # - name:string
  #
end

class Story < ActiveRecord::Base
  belongs_to :collection
  belongs_to :category
  belongs_to :author
  
  has_many :pages
  
  serialize :keywords, Array
  serialize :subkeywords, Array
  
  #
  # attributes:
  # - id:integer
  # - title:string
  # - summary:text
  # - comments:text
  # - date:string
  # - storypages:string
  # - keywords:text
  # - subkeywords:text
  # - collection:references
  # - category:references
  # - author:references
  #
  
  def before_create
    keywords = []
    subkeywords = []
  end
end

class Page < ActiveRecord::Base
  belongs_to :story
  belongs_to :book
  
  #
  # attributes:
  # - name:string
  # - story:references
  # - book:references
  #
end

class CreateTables < ActiveRecord::Migration
  def self.up
    create_table :collections do |t|
      t.string :name
    end
    
    create_table :books do |t|
      t.string :name
      
      t.references :collection
      t.references :first_page
      t.references :last_page
    end
    
    create_table :categories do |t|
      t.string :name
    end
    
    create_table :authors do |t|
      t.string :name
    end
    
    create_table :stories do |t|
      t.string :title
      t.string :summary
      t.string :comments
      t.string :date
      t.string :storypages
      t.text :keywords
      t.text :subkeywords
      
      t.references :collection
      t.references :category
      t.references :author
    end
    
    create_table :pages do |t|
      t.string :name
      
      t.references :story
      t.references :book
    end
  end
  
  def self.down
    %w(collections books categories authors stories pages).each do |name|
      drop_table name.to_sym
    end
  end
end

normalize('data.xml')
