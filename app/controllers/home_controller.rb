class HomeController < ApplicationController
  def map
  end

  def data
    respond_to do |format|
      format.json { render json: @path.to_json }
    end
  end
end
